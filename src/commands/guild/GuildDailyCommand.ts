import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import Entity, {Entities} from "../../core/models/Entity";
import {TranslationModule, Translations} from "../../core/Translations";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";
import Guild, {Guilds} from "../../core/models/Guild";
import {hoursToMinutes, millisecondsToHours, millisecondsToMinutes, minutesToString} from "../../core/utils/TimeUtils";
import {Data, DataModule} from "../../core/Data";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {draftBotClient} from "../../core/bot";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Constants} from "../../core/Constants";
import {RandomUtils} from "../../core/utils/RandomUtils";
import {Maps} from "../../core/Maps";
import {PetEntities} from "../../core/models/PetEntity";
import {GuildPets} from "../../core/models/GuildPet";
import {MissionsController} from "../../core/missions/MissionsController";
import {sendDirectMessage} from "../../core/utils/MessageUtils";
import {escapeUsername} from "../../core/utils/StringUtils";
import {ICommand} from "../ICommand";

/**
 * Allow to claim a daily guild reward
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 * @param forcedReward
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity, forcedReward: string = null): Promise<void> {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	const guildDailyData = Data.getModule("commands.guildDaily");
	if (await sendBlockedErrorInteraction(interaction, language)) {
		return;
	}
	const guild = await Guilds.getById(entity.Player.guildId);

	const time = millisecondsToHours(interaction.createdAt.valueOf() - guild.lastDailyAt.valueOf());
	if (time < guildDailyData.getNumber("timeBetweenDailys") && !forcedReward) {
		sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			guildDailyModule.format("coolDown", {
				coolDownTime: guildDailyData.getNumber("timeBetweenDailys"),
				time: minutesToString(hoursToMinutes(guildDailyData.getNumber("timeBetweenDailys")) - millisecondsToMinutes(interaction.createdAt.valueOf() + guild.lastDailyAt.valueOf()))
			}));
		return;
	}

	const members = await Entities.getByGuild(guild.id);
	for (const member of members) {
		if (await BlockingUtils.getPlayerBlockingReason(member.discordUserId) === "fight") {
			continue;
		}
		if (await sendBlockedError(await draftBotClient.users.fetch(member.discordUserId), interaction.channel, language)) {
			return;
		}
	}

	guild.lastDailyAt = new Date(interaction.createdTimestamp);
	await guild.save();

	let rewardType = generateRandomProperty(guild);
	if (forcedReward) {
		rewardType = forcedReward;
	}

	const embed = await rewardPlayersOfTheGuild(guild, members, language, interaction, rewardType);

	await notifyAndUpdatePlayers(members, interaction, language, guildDailyModule, embed);
}

type GuildLike = { guild: Guild, members: Entity[] }
type StringInfos = { language: string, interaction: CommandInteraction, embed: DraftBotEmbed }
type InformationModules = { guildDailyModule: TranslationModule; guildDailyData: DataModule }

async function genericAwardingFunction(members: Entity[], awardingFunctionForAMember: (member: Entity) => Promise<void> | void) {
	for (const member of members) {
		await awardingFunctionForAMember(member);
		await member.Player.save();
		await member.save();
	}
}

async function awardPersonnalXpToMembers(guildLike: GuildLike, stringInfos: StringInfos, informationModules: InformationModules) {
	const xpWon = RandomUtils.randInt(
		informationModules.guildDailyData.getNumber("minimalXp") + guildLike.guild.level,
		informationModules.guildDailyData.getNumber("maximalXp") + guildLike.guild.level * informationModules.guildDailyData.getNumber("xpMultiplier"));
	await genericAwardingFunction(guildLike.members, member => member.Player.addExperience(xpWon, member, stringInfos.interaction.channel, stringInfos.language));
	stringInfos.embed.setDescription(informationModules.guildDailyModule.format("personalXP", {
		xp: xpWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got " + xpWon + " personal xp");
}

async function awardGuildXp(guildLike: GuildLike, stringInfos: StringInfos, informationModules: InformationModules) {
	const xpGuildWon = RandomUtils.randInt(
		informationModules.guildDailyData.getNumber("minimalXp") + guildLike.guild.level,
		informationModules.guildDailyData.getNumber("minimalXp") + guildLike.guild.level * informationModules.guildDailyData.getNumber("xpMultiplier"));
	await guildLike.guild.addExperience(xpGuildWon, stringInfos.interaction.channel, stringInfos.language);
	await guildLike.guild.save();
	stringInfos.embed.setDescription(informationModules.guildDailyModule.format("guildXP", {
		xp: xpGuildWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got " + xpGuildWon + " guild xp");
}

async function awardMoneyToMembers(guildLike: GuildLike, stringInfos: StringInfos, informationModules: InformationModules, fixed: boolean) {
	const moneyWon = fixed ? informationModules.guildDailyData.getNumber("fixedMoney") : RandomUtils.randInt(
		informationModules.guildDailyData.getNumber("minimalMoney") + guildLike.guild.level,
		informationModules.guildDailyData.getNumber("maximalMoney") + guildLike.guild.level * informationModules.guildDailyData.getNumber("moneyMultiplier"));
	await genericAwardingFunction(guildLike.members, member => member.Player.addMoney(member, moneyWon, stringInfos.interaction.channel, stringInfos.language));
	stringInfos.embed.setDescription(informationModules.guildDailyModule.format("money", {
		money: moneyWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got " + moneyWon + fixed ? "fixed" : "" + " money");
}

async function awardCommonFood(guildLike: GuildLike, stringInfos: StringInfos, informationModules: InformationModules) {
	if (guildLike.guild.commonFood + informationModules.guildDailyData.getNumber("fixedPetFood") > Constants.GUILD.MAX_COMMON_PET_FOOD) {
		await awardMoneyToMembers(guildLike, stringInfos, informationModules, true);
		return;
	}
	guildLike.guild.commonFood += informationModules.guildDailyData.getNumber("fixedPetFood");
	await Promise.all([guildLike.guild.save()]);
	stringInfos.embed.setDescription(informationModules.guildDailyModule.format("petFood", {
		quantity: informationModules.guildDailyData.getNumber("fixedPetFood")
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got common food");
}

async function awardGuildBadgeToMembers(guildLike: GuildLike, stringInfos: StringInfos, informationModules: InformationModules) {
	let membersThatOwnTheBadge = 0;
	await genericAwardingFunction(guildLike.members, member => {
		if (!member.Player.addBadge(Constants.BADGES.POWERFUL_GUILD)) {
			membersThatOwnTheBadge++;
		}
	});
	if (membersThatOwnTheBadge === guildLike.members.length) {
		// everybody already has the badge, give something else instead
		await healEveryMember(guildLike, stringInfos, informationModules);
		return;
	}
	stringInfos.embed.setDescription(informationModules.guildDailyModule.get("badge"));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got the badge");
}

async function fullHealEveryMember(guildLike: GuildLike, stringInfos: StringInfos, informationModules: InformationModules) {
	await genericAwardingFunction(guildLike.members, async member => {
		if (member.Player.effect !== Constants.EFFECT.DEAD) {
			await member.setHealth(await member.getMaxHealth(), stringInfos.interaction.channel, stringInfos.language);
		}
	});
	stringInfos.embed.setDescription(informationModules.guildDailyModule.get("fullHeal"));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got full heal");
}

async function advanceTimeOfEveryMember(guildLike: GuildLike, stringInfos: StringInfos, informationModules: InformationModules) {
	const timeAdvanced = Math.round(guildLike.guild.level * informationModules.guildDailyData.getNumber("timeAdvanceMultiplier"));
	await genericAwardingFunction(guildLike.members, member => Maps.advanceTime(member.Player, hoursToMinutes(timeAdvanced)));
	stringInfos.embed.setDescription(informationModules.guildDailyModule.format("hospital", {
		timeMoved: timeAdvanced
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got moved up");
}

async function healEveryMember(guildLike: GuildLike, stringInfos: StringInfos, informationModules: InformationModules) {
	const healthWon = Math.round(guildLike.guild.level * informationModules.guildDailyData.getNumber("levelMultiplier"));
	await genericAwardingFunction(guildLike.members, async member => {
		if (member.Player.effect !== Constants.EFFECT.DEAD) {
			await member.addHealth(healthWon, stringInfos.interaction.channel, stringInfos.language);
		}
	});
	stringInfos.embed.setDescription(informationModules.guildDailyModule.format("partialHeal", {
		healthWon: healthWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got partial heal");
}

async function alterationHealEveryMember(guildLike: GuildLike, stringInfos: StringInfos, informationModules: InformationModules) {
	const healthWon = Math.round(guildLike.guild.level * informationModules.guildDailyData.getNumber("levelMultiplier"));
	await genericAwardingFunction(guildLike.members, async member => {
		if (member.Player.currentEffectFinished()) {
			await member.addHealth(healthWon, stringInfos.interaction.channel, stringInfos.language);
		}
		else if (member.Player.effect !== Constants.EFFECT.DEAD && member.Player.effect !== Constants.EFFECT.LOCKED) {
			await Maps.removeEffect(member.Player);
		}
	});
	stringInfos.embed.setDescription(informationModules.guildDailyModule.format("alterationHeal", {
		healthWon: healthWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got alteration heal");
}

async function awardAndPrepareEmbedForReward(rewardType: string, guildLike: GuildLike, stringInfos: StringInfos, informationModules: InformationModules) {
	switch (rewardType) {
	case Constants.REWARD_TYPES.PERSONAL_XP:
		await awardPersonnalXpToMembers(guildLike, stringInfos, informationModules);
		break;
	case Constants.REWARD_TYPES.GUILD_XP:
		await awardGuildXp(guildLike, stringInfos, informationModules);
		break;
	case Constants.REWARD_TYPES.MONEY:
		await awardMoneyToMembers(guildLike, stringInfos, informationModules, false);
		break;
	case Constants.REWARD_TYPES.PET_FOOD:
		await awardCommonFood(guildLike, stringInfos, informationModules);
		break;
	case Constants.REWARD_TYPES.FIXED_MONEY:
		await awardMoneyToMembers(guildLike, stringInfos, informationModules, true);
		break;
	case Constants.REWARD_TYPES.BADGE:
		await awardGuildBadgeToMembers(guildLike, stringInfos, informationModules);
		break;
	case Constants.REWARD_TYPES.FULL_HEAL:
		await fullHealEveryMember(guildLike, stringInfos, informationModules);
		break;
	case Constants.REWARD_TYPES.HOSPITAL:
		await advanceTimeOfEveryMember(guildLike, stringInfos, informationModules);
		break;
	case Constants.REWARD_TYPES.PARTIAL_HEAL:
		await healEveryMember(guildLike, stringInfos, informationModules);
		break;
	case Constants.REWARD_TYPES.ALTERATION:
		await alterationHealEveryMember(guildLike, stringInfos, informationModules);
		break;
	default:
		throw new Error("Wrong reward announced : " + rewardType);
	}
}

async function rewardPlayersOfTheGuild(guild: Guild, members: Entity[], language: string, interaction: CommandInteraction, rewardType: string): Promise<DraftBotEmbed> {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	const guildDailyData = Data.getModule("commands.guildDaily");
	const embed: DraftBotEmbed = new DraftBotEmbed()
		.setTitle(guildDailyModule.format("rewardTitle", {
			guildName: guild.name
		}));
	const guildLike: GuildLike = {guild, members};
	const stringInfos: StringInfos = {language, interaction, embed};
	const informationModules: InformationModules = {guildDailyModule, guildDailyData};
	await awardAndPrepareEmbedForReward(rewardType, guildLike, stringInfos, informationModules);

	if (!guild.isPetShelterFull() && RandomUtils.draftbotRandom.realZeroToOneInclusive() <= 0.01) {
		const pet = await PetEntities.generateRandomPetEntity(guild.level);
		await pet.save();
		await (await GuildPets.addPet(guild.id, pet.id)).save();
		embed.setDescription(embed.description + "\n\n" + guildDailyModule.format("pet", {
			emote: pet.getPetEmote(),
			pet: pet.getPetTypeName(language)
		}));
		// TODO REFACTOR LES LOGS
		// log("GuildDaily of guild " + guild.name + ": got pet: " + pet.getPetEmote() + " " + pet.getPetTypeName("en"));
	}

	await interaction.reply({embeds: [embed]});
	return embed;
}

async function notifyAndUpdatePlayers(members: Entity[], interaction: CommandInteraction, language: string, guildDailyModule: TranslationModule, embed: any) {
	for (const member of members) {
		const user = await draftBotClient.users.fetch(member.discordUserId);
		await MissionsController.update(member.discordUserId, interaction.channel, language, "guildDaily");
		if (member.Player.dmNotification && member.discordUserId !== interaction.user.id) {
			sendDirectMessage(
				user,
				guildDailyModule.get("dmNotification.title"),

				guildDailyModule.format("dmNotification.description",
					{
						serveur: interaction.guild.name,
						pseudo: escapeUsername(interaction.user.username)
					}
				) + embed.description,
				Constants.MESSAGES.COLORS.DEFAULT,
				language
			);
		}
	}
}

function generateRandomProperty(guild: Guild): string {
	const dataModule = Data.getModule("commands.guildDaily");
	let resultNumber = RandomUtils.randInt(0, 1000);
	const rewardLevel = Math.floor(guild.level / dataModule.getNumber("sizePalier"));
	const recompenses = dataModule.getObjectFromArray("guildChances", rewardLevel);
	for (const property in recompenses) {
		if (recompenses[property] < resultNumber) {
			resultNumber -= recompenses[property];
		}
		else {
			return property;
		}
	}
	throw new Error("Erreur generateRandomProperty : nombre property invalide");
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guilddaily")
		.setDescription("Recolt the daily reward of your guild"),
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: Constants.GUILD.REQUIRED_LEVEL,
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildPermissions: null,
		guildRequired: true,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};