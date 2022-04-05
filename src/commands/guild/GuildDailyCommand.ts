import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import Entity, {Entities} from "../../core/models/Entity";
import {TranslationModule, Translations} from "../../core/Translations";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";
import Guild, {Guilds} from "../../core/models/Guild";
import {hoursToMinutes, millisecondsToHours, millisecondsToMinutes, minutesToString} from "../../core/utils/TimeUtils";
import {Data} from "../../core/Data";
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


async function genericAwardingFunction(members: Entity[], awardingFunctionForAMember: (member: Entity) => Promise<void> | void) {
	for (const member of members) {
		await awardingFunctionForAMember(member);
		await member.Player.save();
		await member.save();
	}
}

async function awardPersonnalXpToMembers(guild: Guild, members: Entity[], language: string, embed: DraftBotEmbed, interaction: CommandInteraction) {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	const guildDailyData = Data.getModule("commands.guildDaily");
	const xpWon = RandomUtils.randInt(
		guildDailyData.getNumber("minimalXp") + guild.level,
		guildDailyData.getNumber("maximalXp") + guild.level * guildDailyData.getNumber("xpMultiplier"));
	await genericAwardingFunction(members, member => member.Player.addExperience(xpWon, member, interaction.channel, language));
	embed.setDescription(guildDailyModule.format("personalXP", {
		xp: xpWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got " + xpWon + " personal xp");
}

async function awardGuildXp(guild: Guild, language: string, embed: DraftBotEmbed, interaction: CommandInteraction) {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	const guildDailyData = Data.getModule("commands.guildDaily");
	const xpGuildWon = RandomUtils.randInt(
		guildDailyData.getNumber("minimalXp") + guild.level,
		guildDailyData.getNumber("minimalXp") + guild.level * guildDailyData.getNumber("xpMultiplier"));
	await guild.addExperience(xpGuildWon, interaction.channel, language);
	await guild.save();
	embed.setDescription(guildDailyModule.format("guildXP", {
		xp: xpGuildWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got " + xpGuildWon + " guild xp");
}

async function awardVariableMoneyToMembers(guild: Guild, members: Entity[], language: string, embed: DraftBotEmbed, interaction: CommandInteraction) {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	const guildDailyData = Data.getModule("commands.guildDaily");
	const moneyWon = RandomUtils.randInt(
		guildDailyData.getNumber("minimalMoney") + guild.level,
		guildDailyData.getNumber("maximalMoney") + guild.level * guildDailyData.getNumber("moneyMultiplier"));
	await genericAwardingFunction(members, member => member.Player.addMoney(member, moneyWon, interaction.channel, language));
	embed.setDescription(guildDailyModule.format("money", {
		money: moneyWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got " + moneyWon + " money");
}

async function awardCommonFood(guild: Guild, language: string, embed: DraftBotEmbed) {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	const guildDailyData = Data.getModule("commands.guildDaily");
	guild.commonFood += guildDailyData.getNumber("fixedPetFood");
	await Promise.all([guild.save()]);
	embed.setDescription(guildDailyModule.format("petFood", {
		quantity: guildDailyData.getNumber("fixedPetFood")
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got common food");
}

async function awardFixedMoneyToMembers(members: Entity[], language: string, embed: DraftBotEmbed, interaction: CommandInteraction) {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	const guildDailyData = Data.getModule("commands.guildDaily");
	const moneyWon = guildDailyData.getNumber("fixedMoney");
	await genericAwardingFunction(members, member => member.Player.addMoney(member, moneyWon, interaction.channel, language));
	embed.setDescription(guildDailyModule.format("money", {
		money: moneyWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got " + moneyWon + " fixed money");
}

async function awardGuildBadgeToMembers(members: Entity[]): Promise<number> {
	let membersThatOwnTheBadge = 0;
	await genericAwardingFunction(members, member => {
		if (!member.Player.addBadge(Constants.BADGES.POWERFUL_GUILD)) {
			membersThatOwnTheBadge++;
		}
	});
	return membersThatOwnTheBadge;
}

async function fullHealEveryMember(members: Entity[], language: string, embed: DraftBotEmbed, interaction: CommandInteraction) {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	await genericAwardingFunction(members, async member => {
		if (member.Player.effect !== Constants.EFFECT.DEAD) {
			await member.setHealth(await member.getMaxHealth(), interaction.channel, language);
		}
	});
	embed.setDescription(guildDailyModule.get("fullHeal"));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got full heal");
}

async function advanceTimeOfEveryMember(guild: Guild, members: Entity[], embed: DraftBotEmbed, language: string) {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	const guildDailyData = Data.getModule("commands.guildDaily");
	const timeAdvanced = Math.round(guild.level * guildDailyData.getNumber("timeAdvanceMultiplier"));
	await genericAwardingFunction(members, member => Maps.advanceTime(member.Player, hoursToMinutes(timeAdvanced)));
	embed.setDescription(guildDailyModule.format("hospital", {
		timeMoved: timeAdvanced
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got moved up");
}

async function healEveryMember(guild: Guild, members: Entity[], language: string, embed: DraftBotEmbed, interaction: CommandInteraction) {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	const guildDailyData = Data.getModule("commands.guildDaily");
	const healthWon = Math.round(guild.level * guildDailyData.getNumber("levelMultiplier"));
	await genericAwardingFunction(members, async member => {
		if (member.Player.effect !== Constants.EFFECT.DEAD) {
			await member.addHealth(healthWon, interaction.channel, language);
		}
	});
	embed.setDescription(guildDailyModule.format("partialHeal", {
		healthWon: healthWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got partial heal");
}

async function alterationHealEveryMember(guild: Guild, members: Entity[], language: string, embed: DraftBotEmbed, interaction: CommandInteraction) {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	const guildDailyData = Data.getModule("commands.guildDaily");
	const healthWon = Math.round(guild.level * guildDailyData.getNumber("levelMultiplier"));
	await genericAwardingFunction(members, async member => {
		if (member.Player.currentEffectFinished()) {
			await member.addHealth(healthWon, interaction.channel, language);
		}
		else if (member.Player.effect !== Constants.EFFECT.DEAD && member.Player.effect !== Constants.EFFECT.LOCKED) {
			await Maps.removeEffect(member.Player);
		}
	});
	embed.setDescription(guildDailyModule.format("alterationHeal", {
		healthWon: healthWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got alteration heal");
}

async function rewardPlayersOfTheGuild(guild: Guild, members: Entity[], language: string, interaction: CommandInteraction, rewardType: string): Promise<DraftBotEmbed> {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	const guildDailyData = Data.getModule("commands.guildDaily");
	const embed: DraftBotEmbed = new DraftBotEmbed()
		.setTitle(guildDailyModule.format("rewardTitle", {
			guildName: guild.name
		}));
	switch (rewardType) {
	case Constants.REWARD_TYPES.PERSONAL_XP:
		await awardPersonnalXpToMembers(guild, members, language, embed, interaction);
		break;
	case Constants.REWARD_TYPES.GUILD_XP:
		await awardGuildXp(guild, language, embed, interaction);
		break;
	case Constants.REWARD_TYPES.MONEY:
		await awardVariableMoneyToMembers(guild, members, language, embed, interaction);
		break;
	case Constants.REWARD_TYPES.PET_FOOD:
		if (guild.commonFood + guildDailyData.getNumber("fixedPetFood") > Constants.GUILD.MAX_COMMON_PET_FOOD) {
			return await rewardPlayersOfTheGuild(guild, members, language, interaction, Constants.REWARD_TYPES.FIXED_MONEY);
		}
		await awardCommonFood(guild, language, embed);
		break;
	case Constants.REWARD_TYPES.FIXED_MONEY:
		await awardFixedMoneyToMembers(members, language, embed, interaction);
		break;
	case Constants.REWARD_TYPES.BADGE:
		if (await awardGuildBadgeToMembers(members) === members.length) {
			// everybody already has the badge, give something else instead
			return await rewardPlayersOfTheGuild(guild, members, language, interaction, Constants.REWARD_TYPES.PARTIAL_HEAL);
		}
		embed.setDescription(guildDailyModule.get("badge"));
		// TODO REFACTOR LES LOGS
		// log("GuildDaily of guild " + guild.name + ": got the badge");
		break;
	case Constants.REWARD_TYPES.FULL_HEAL:
		await fullHealEveryMember(members, language, embed, interaction);
		break;
	case Constants.REWARD_TYPES.HOSPITAL:
		await advanceTimeOfEveryMember(guild, members, embed, language);
		break;
	case Constants.REWARD_TYPES.PARTIAL_HEAL:
		await healEveryMember(guild, members, language, embed, interaction);
		break;
	case Constants.REWARD_TYPES.ALTERATION:
		await alterationHealEveryMember(guild, members, language, embed, interaction);
		break;
	default:
		throw new Error("Wrong reward announced : " + rewardType);
	}

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