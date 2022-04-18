import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import Entity, {Entities} from "../../core/models/Entity";
import {TranslationModule, Translations} from "../../core/Translations";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";
import Guild, {Guilds} from "../../core/models/Guild";
import {hoursToMinutes, millisecondsToHours, minutesDisplay} from "../../core/utils/TimeUtils";
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
import {GuildDailyConstants} from "../../core/constants/GuildDailyConstants";

type GuildLike = { guild: Guild, members: Entity[] };
type StringInfos = {interaction: CommandInteraction, embed: DraftBotEmbed };
type RewardPalier = { [key: string]: number };

const linkToFunction = getMapOfAllRewardCommands();

/**
 * Allow to claim a daily guild reward
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 * @param forcedReward
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity, forcedReward: string = null): Promise<void> {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	if (await sendBlockedErrorInteraction(interaction, language)) {
		return;
	}
	const guild = await Guilds.getById(entity.Player.guildId);

	const time = millisecondsToHours(interaction.createdAt.valueOf() - guild.lastDailyAt.valueOf());
	if (time < GuildDailyConstants.TIME_BETWEEN_DAILIES && !forcedReward) {
		sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			guildDailyModule.format("coolDown", {
				coolDownTime: GuildDailyConstants.TIME_BETWEEN_DAILIES,
				time: minutesDisplay(hoursToMinutes(GuildDailyConstants.TIME_BETWEEN_DAILIES - time))
			}),
			false,
			interaction);
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

	const rewardType = forcedReward ?? generateRandomProperty(guild);

	const embed = await rewardPlayersOfTheGuild(guild, members, language, interaction, rewardType);

	await notifyAndUpdatePlayers(members, interaction, language, guildDailyModule, embed);
}

/**
 * Generic function to call when awarding members of a guild personnally
 * @param members
 * @param awardingFunctionForAMember
 */
async function genericAwardingFunction(members: Entity[], awardingFunctionForAMember: (member: Entity) => Promise<void> | void) {
	for (const member of members) {
		await awardingFunctionForAMember(member);
		await member.Player.save();
		await member.save();
	}
}

async function awardPersonnalXpToMembers(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule) {
	const xpWon = RandomUtils.randInt(
		GuildDailyConstants.MINIMAL_XP + guildLike.guild.level,
		GuildDailyConstants.MAXIMAL_XP + guildLike.guild.level * GuildDailyConstants.XP_MULTIPLIER);
	await genericAwardingFunction(guildLike.members, member => member.Player.addExperience(xpWon, member, stringInfos.interaction.channel, guildDailyModule.language));
	stringInfos.embed.setDescription(guildDailyModule.format("personalXP", {
		xp: xpWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got " + xpWon + " personal xp");
}

async function awardGuildXp(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule) {
	const xpGuildWon = RandomUtils.randInt(
		GuildDailyConstants.MINIMAL_XP + guildLike.guild.level,
		GuildDailyConstants.MAXIMAL_XP + guildLike.guild.level * GuildDailyConstants.XP_MULTIPLIER);
	await guildLike.guild.addExperience(xpGuildWon, stringInfos.interaction.channel, guildDailyModule.language);
	await guildLike.guild.save();
	stringInfos.embed.setDescription(guildDailyModule.format("guildXP", {
		xp: xpGuildWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got " + xpGuildWon + " guild xp");
}

async function awardMoneyToMembers(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule, fixed = false) {
	const moneyWon = fixed ? GuildDailyConstants.FIXED_MONEY : RandomUtils.randInt(
		GuildDailyConstants.MINIMAL_MONEY + guildLike.guild.level,
		GuildDailyConstants.MAXIMAL_XP + guildLike.guild.level * GuildDailyConstants.MONEY_MULTIPLIER);
	await genericAwardingFunction(guildLike.members, member => member.Player.addMoney(member, moneyWon, stringInfos.interaction.channel, guildDailyModule.language));
	stringInfos.embed.setDescription(guildDailyModule.format("money", {
		money: moneyWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got " + moneyWon + fixed ? "fixed" : "" + " money");
}

async function awardFixedMoneyToMembers(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule) {
	await awardMoneyToMembers(guildLike, stringInfos, guildDailyModule, true);
}

async function awardCommonFood(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule) {
	if (guildLike.guild.commonFood + GuildDailyConstants.FIXED_PET_FOOD > Constants.GUILD.MAX_COMMON_PET_FOOD) {
		await awardFixedMoneyToMembers(guildLike, stringInfos, guildDailyModule);
		return;
	}
	guildLike.guild.commonFood += GuildDailyConstants.FIXED_PET_FOOD;
	await Promise.all([guildLike.guild.save()]);
	stringInfos.embed.setDescription(guildDailyModule.format("petFood", {
		quantity: GuildDailyConstants.FIXED_PET_FOOD
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got common food");
}

async function awardGuildBadgeToMembers(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule) {
	let membersThatOwnTheBadge = 0;
	await genericAwardingFunction(guildLike.members, member => {
		if (!member.Player.addBadge(Constants.BADGES.POWERFUL_GUILD)) {
			membersThatOwnTheBadge++;
		}
	});
	if (membersThatOwnTheBadge === guildLike.members.length) {
		// everybody already has the badge, give something else instead
		await healEveryMember(guildLike, stringInfos, guildDailyModule);
		return;
	}
	stringInfos.embed.setDescription(guildDailyModule.get("badge"));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got the badge");
}

async function fullHealEveryMember(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule) {
	await genericAwardingFunction(guildLike.members, async member => {
		if (member.Player.effect !== Constants.EFFECT.DEAD) {
			await member.setHealth(await member.getMaxHealth(), stringInfos.interaction.channel, guildDailyModule.language);
		}
	});
	stringInfos.embed.setDescription(guildDailyModule.get("fullHeal"));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got full heal");
}

async function advanceTimeOfEveryMember(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule) {
	const timeAdvanced = Math.round(guildLike.guild.level * GuildDailyConstants.TIME_ADVANCED_MULTIPLIER);
	await genericAwardingFunction(guildLike.members, member => Maps.advanceTime(member.Player, hoursToMinutes(timeAdvanced)));
	stringInfos.embed.setDescription(guildDailyModule.format("hospital", {
		timeMoved: timeAdvanced
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got moved up");
}

async function healEveryMember(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule) {
	const healthWon = Math.round(guildLike.guild.level * GuildDailyConstants.LEVEL_MULTIPLIER);
	await genericAwardingFunction(guildLike.members, async member => {
		if (member.Player.effect !== Constants.EFFECT.DEAD) {
			await member.addHealth(healthWon, stringInfos.interaction.channel, guildDailyModule.language);
		}
	});
	stringInfos.embed.setDescription(guildDailyModule.format("partialHeal", {
		healthWon: healthWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got partial heal");
}

async function alterationHealEveryMember(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule) {
	const healthWon = Math.round(guildLike.guild.level * GuildDailyConstants.LEVEL_MULTIPLIER);
	await genericAwardingFunction(guildLike.members, async member => {
		if (member.Player.currentEffectFinished()) {
			await member.addHealth(healthWon, stringInfos.interaction.channel, guildDailyModule.language);
		}
		else if (member.Player.effect !== Constants.EFFECT.DEAD && member.Player.effect !== Constants.EFFECT.LOCKED) {
			await Maps.removeEffect(member.Player);
		}
	});
	stringInfos.embed.setDescription(guildDailyModule.format("alterationHeal", {
		healthWon: healthWon
	}));
	// TODO REFACTOR LES LOGS
	// log("GuildDaily of guild " + guild.name + ": got alteration heal");
}

async function awardGuildWithNewPet(guild: Guild, embed: DraftBotEmbed, guildDailyModule: TranslationModule, language: string) {
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

/**
 * Rewards the members of the guild and sends the reward embed
 * @param guild
 * @param members
 * @param language
 * @param interaction
 * @param rewardType
 */
async function rewardPlayersOfTheGuild(guild: Guild, members: Entity[], language: string, interaction: CommandInteraction, rewardType: string): Promise<DraftBotEmbed> {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	const embed: DraftBotEmbed = new DraftBotEmbed()
		.setTitle(guildDailyModule.format("rewardTitle", {
			guildName: guild.name
		}));
	const guildLike: GuildLike = {guild, members};
	const stringInfos: StringInfos = {interaction, embed};

	/*
	Here is the fun part !
	First collect the function which is associated to the given reward (linkToFunction.get(rewardType))
	Then call this function using the prepared parameters above
	And Voilà ! You rewarded all the members of the guild according to rewardType !
	*/
	await linkToFunction.get(rewardType)(guildLike, stringInfos, guildDailyModule);

	if (!guild.isPetShelterFull() && RandomUtils.draftbotRandom.realZeroToOneInclusive() <= GuildDailyConstants.PET_DROP_CHANCE) {
		await awardGuildWithNewPet(guild, embed, guildDailyModule, language);
	}

	await interaction.reply({embeds: [embed]});
	return embed;
}

/**
 * Updates the guilddaily mission for each member of the guild and send a private message for those who have dms opened
 * @param members
 * @param interaction
 * @param language
 * @param guildDailyModule
 * @param embed
 */
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

/**
 * Generates the reward that will be awarded by the guild
 * @param guild
 */
function generateRandomProperty(guild: Guild): string {
	let resultNumber = RandomUtils.randInt(0, GuildDailyConstants.CHANCES_SUM);
	const rewardLevel = Math.floor(guild.level / GuildDailyConstants.SIZE_PALIER);
	const recompenses: RewardPalier = GuildDailyConstants.GUILD_CHANCES[rewardLevel];
	for (const reward of Object.keys(recompenses)) {
		if (recompenses[reward] < resultNumber) {
			resultNumber -= recompenses[reward];
		}
		else {
			return reward;
		}
	}
	throw new Error("Erreur generateRandomProperty : nombre property invalide");
}

/**
 * Map all possible rewards to the corresponding rewarding function
 */
function getMapOfAllRewardCommands() {
	const linkToFunction = new Map<string,(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule) => Promise<void>>();
	linkToFunction.set(Constants.REWARD_TYPES.PERSONAL_XP, awardPersonnalXpToMembers);
	linkToFunction.set(Constants.REWARD_TYPES.GUILD_XP, awardGuildXp);
	linkToFunction.set(Constants.REWARD_TYPES.MONEY, awardMoneyToMembers);
	linkToFunction.set(Constants.REWARD_TYPES.PET_FOOD, awardCommonFood);
	linkToFunction.set(Constants.REWARD_TYPES.FIXED_MONEY, awardFixedMoneyToMembers);
	linkToFunction.set(Constants.REWARD_TYPES.BADGE, awardGuildBadgeToMembers);
	linkToFunction.set(Constants.REWARD_TYPES.FULL_HEAL, fullHealEveryMember);
	linkToFunction.set(Constants.REWARD_TYPES.HOSPITAL, advanceTimeOfEveryMember);
	linkToFunction.set(Constants.REWARD_TYPES.PARTIAL_HEAL, healEveryMember);
	linkToFunction.set(Constants.REWARD_TYPES.ALTERATION, alterationHealEveryMember);
	return linkToFunction;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guilddaily")
		.setDescription("Recolt the daily reward of your guild"),
	executeCommand,
	requirements: {
		requiredLevel: Constants.GUILD.REQUIRED_LEVEL,
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildRequired: true
	},
	mainGuildCommand: false
};