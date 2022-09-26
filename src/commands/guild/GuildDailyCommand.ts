import {CommandInteraction} from "discord.js";
import Entity, {Entities} from "../../core/database/game/models/Entity";
import {TranslationModule, Translations} from "../../core/Translations";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import Guild, {Guilds} from "../../core/database/game/models/Guild";
import {hoursToMinutes, millisecondsToHours, minutesDisplay} from "../../core/utils/TimeUtils";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {draftBotClient, draftBotInstance} from "../../core/bot";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Constants} from "../../core/Constants";
import {RandomUtils} from "../../core/utils/RandomUtils";
import {Maps} from "../../core/Maps";
import {PetEntities} from "../../core/database/game/models/PetEntity";
import {GuildPets} from "../../core/database/game/models/GuildPet";
import {MissionsController} from "../../core/missions/MissionsController";
import {sendDirectMessage} from "../../core/utils/MessageUtils";
import {escapeUsername} from "../../core/utils/StringUtils";
import {ICommand} from "../ICommand";
import {GuildDailyConstants} from "../../core/constants/GuildDailyConstants";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

type GuildLike = { guild: Guild, members: Entity[] };
type StringInfos = { interaction: CommandInteraction, embed: DraftBotEmbed };
type RewardPalier = { [key: string]: number };
type FunctionRewardType = (guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule) => Promise<void>;

const linkToFunction = getMapOfAllRewardCommands();

/**
 * Reward the guild with a new pet if they are lucky
 * @param guild
 * @param embed
 * @param guildDailyModule
 * @param language
 */
async function awardGuildWithNewPet(guild: Guild, embed: DraftBotEmbed, guildDailyModule: TranslationModule, language: string): Promise<void> {
	const pet = await PetEntities.generateRandomPetEntity(guild.level);
	await pet.save();
	await GuildPets.addPet(guild, pet, true).save();
	embed.setDescription(`${embed.data.description}\n\n${guildDailyModule.format("pet", {
		emote: pet.getPetEmote(),
		pet: pet.getPetTypeName(language)
	})}`);
}

/**
 * Rewards the members of the guild and sends the reward embed
 * @param guildLike
 * @param language
 * @param interaction
 * @param rewardType
 */
async function rewardPlayersOfTheGuild(guildLike: GuildLike, language: string, interaction: CommandInteraction, rewardType: string): Promise<DraftBotEmbed> {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	const embed: DraftBotEmbed = new DraftBotEmbed()
		.setTitle(guildDailyModule.format("rewardTitle", {
			guildName: guildLike.guild.name
		}));
	const stringInfos: StringInfos = {interaction, embed};

	/*
	Here is the fun part !
	First collect the function which is associated to the given reward (linkToFunction.get(rewardType))
	Then call this function using the prepared parameters above
	And Voilà ! You rewarded all the members of the guild according to rewardType !
	*/
	await linkToFunction.get(rewardType)(guildLike, stringInfos, guildDailyModule);

	if (!guildLike.guild.isPetShelterFull() && RandomUtils.draftbotRandom.realZeroToOneInclusive() <= GuildDailyConstants.PET_DROP_CHANCE) {
		await awardGuildWithNewPet(guildLike.guild, embed, guildDailyModule, language);
	}

	await interaction.editReply({embeds: [embed]});
	return embed;
}

/**
 * Generic function to call when awarding members of a guild personally
 * @param members
 * @param awardingFunctionForAMember
 */
async function genericAwardingFunction(members: Entity[], awardingFunctionForAMember: (member: Entity) => Promise<void> | void): Promise<void> {
	for (const member of members) {
		await awardingFunctionForAMember(member);
		await member.Player.save();
		await member.save();
	}
}

/**
 * Generic function to award money to every member of a guild
 * @param guildLike
 * @param stringInfos
 * @param guildDailyModule
 */
async function awardMoneyToMembers(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule): Promise<void> {
	const moneyWon = RandomUtils.randInt(
		GuildDailyConstants.MINIMAL_MONEY + guildLike.guild.level,
		GuildDailyConstants.MAXIMAL_MONEY + guildLike.guild.level * GuildDailyConstants.MONEY_MULTIPLIER);
	await genericAwardingFunction(guildLike.members, member => member.Player.addMoney({
		entity: member,
		amount: moneyWon,
		channel: stringInfos.interaction.channel,
		language: guildDailyModule.language,
		reason: NumberChangeReason.GUILD_DAILY
	}));
	stringInfos.embed.setDescription(guildDailyModule.format("money", {
		money: moneyWon
	}));
	draftBotInstance.logsDatabase.logGuildDaily(guildLike.guild, GuildDailyConstants.REWARD_TYPES.MONEY).then();
}

/**
 * Say if someone in the guild needs healing
 * @param guildLike
 */
async function doesSomeoneNeedsHeal(guildLike: GuildLike): Promise<boolean> {
	for (const member of guildLike.members) {
		if (member.health !== await member.getMaxHealth()) {
			return true;
		}
	}
	return false;
}

/**
 * Generic function to award a partial heal to every member of a guild
 * @param guildLike
 * @param stringInfos
 * @param guildDailyModule
 * @param fullHeal
 */
async function healEveryMember(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule, fullHeal = false): Promise<void> {
	const healthWon = Math.round(guildLike.guild.level * GuildDailyConstants.LEVEL_MULTIPLIER) + 1;
	if (!await doesSomeoneNeedsHeal(guildLike)) {
		// Pas de heal donné : don de money
		return await awardMoneyToMembers(guildLike, stringInfos, guildDailyModule);
	}
	await genericAwardingFunction(guildLike.members, async member => {
		if (member.Player.effect !== EffectsConstants.EMOJI_TEXT.DEAD) {
			await member.addHealth(
				fullHeal ? await member.getMaxHealth() : healthWon,
				stringInfos.interaction.channel,
				guildDailyModule.language,
				NumberChangeReason.GUILD_DAILY,
				{
					shouldPokeMission: true,
					overHealCountsForMission: !fullHeal
				}
			);
		}
	});
	fullHeal
		? stringInfos.embed.setDescription(guildDailyModule.get("fullHeal"))
		: stringInfos.embed.setDescription(guildDailyModule.format("partialHeal", {
			healthWon: healthWon
		}));
	draftBotInstance.logsDatabase.logGuildDaily(guildLike.guild, fullHeal ? GuildDailyConstants.REWARD_TYPES.FULL_HEAL : GuildDailyConstants.REWARD_TYPES.PARTIAL_HEAL).then();
}

/**
 * Generic function to heal the members of a guild
 * @param guildLike
 * @param stringInfos
 * @param guildDailyModule
 */
async function alterationHealEveryMember(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule): Promise<void> {
	const healthWon = Math.round(guildLike.guild.level * GuildDailyConstants.LEVEL_MULTIPLIER);
	let noAlteHeal = true;
	const needsHeal = await doesSomeoneNeedsHeal(guildLike);
	await genericAwardingFunction(guildLike.members, async member => {
		if (member.Player.currentEffectFinished() && needsHeal) {
			return await member.addHealth(healthWon, stringInfos.interaction.channel, guildDailyModule.language, NumberChangeReason.GUILD_DAILY);
		}
		if (member.Player.effect !== EffectsConstants.EMOJI_TEXT.DEAD && member.Player.effect !== EffectsConstants.EMOJI_TEXT.LOCKED) {
			noAlteHeal = false;
			await Maps.removeEffect(member.Player, NumberChangeReason.GUILD_DAILY);
		}
	});
	if (!needsHeal && noAlteHeal) {
		// Pas de heal donné : don de money
		return await awardMoneyToMembers(guildLike, stringInfos, guildDailyModule);
	}
	stringInfos.embed.setDescription(guildDailyModule.format(healthWon > 0 ? "alterationHeal" : "alterationNoHeal", {
		healthWon: healthWon
	}));
	draftBotInstance.logsDatabase.logGuildDaily(guildLike.guild, GuildDailyConstants.REWARD_TYPES.ALTERATION).then();
}

/**
 * Generic function to award experience to members of a guild
 * @param guildLike
 * @param stringInfos
 * @param guildDailyModule
 */
async function awardPersonalXpToMembers(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule): Promise<void> {
	const xpWon = RandomUtils.randInt(
		GuildDailyConstants.MINIMAL_XP + guildLike.guild.level,
		GuildDailyConstants.MAXIMAL_XP + guildLike.guild.level * GuildDailyConstants.XP_MULTIPLIER);
	await genericAwardingFunction(guildLike.members, member => member.Player.addExperience({
		entity: member,
		amount: xpWon,
		channel: stringInfos.interaction.channel,
		language: guildDailyModule.language,
		reason: NumberChangeReason.GUILD_DAILY
	}));
	stringInfos.embed.setDescription(guildDailyModule.format("personalXP", {
		xp: xpWon
	}));
	draftBotInstance.logsDatabase.logGuildDaily(guildLike.guild, GuildDailyConstants.REWARD_TYPES.PERSONAL_XP).then();
}

/**
 * Generic function to award experience to a guild
 * @param guildLike
 * @param stringInfos
 * @param guildDailyModule
 */
async function awardGuildXp(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule): Promise<void> {
	const xpGuildWon = RandomUtils.randInt(
		GuildDailyConstants.MINIMAL_XP + guildLike.guild.level,
		GuildDailyConstants.MAXIMAL_XP + guildLike.guild.level * GuildDailyConstants.XP_MULTIPLIER);
	await guildLike.guild.addExperience(xpGuildWon, stringInfos.interaction.channel, guildDailyModule.language, NumberChangeReason.GUILD_DAILY);
	await guildLike.guild.save();
	stringInfos.embed.setDescription(guildDailyModule.format("guildXP", {
		xp: xpGuildWon
	}));
	draftBotInstance.logsDatabase.logGuildDaily(guildLike.guild, GuildDailyConstants.REWARD_TYPES.GUILD_XP).then();
}

/**
 * Generic function to award a pet food to a guild
 * @param guildLike
 * @param stringInfos
 * @param guildDailyModule
 */
async function awardCommonFood(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule): Promise<void> {
	if (guildLike.guild.commonFood + GuildDailyConstants.FIXED_PET_FOOD > Constants.GUILD.MAX_COMMON_PET_FOOD) {
		return await awardMoneyToMembers(guildLike, stringInfos, guildDailyModule);
	}
	guildLike.guild.commonFood += GuildDailyConstants.FIXED_PET_FOOD;
	await Promise.all([guildLike.guild.save()]);
	stringInfos.embed.setDescription(guildDailyModule.format("petFood", {
		quantity: GuildDailyConstants.FIXED_PET_FOOD
	}));
	draftBotInstance.logsDatabase.logGuildDaily(guildLike.guild, GuildDailyConstants.REWARD_TYPES.PET_FOOD).then();
}

/**
 * Generic function to fully heal members of a guild
 * @param guildLike
 * @param stringInfos
 * @param guildDailyModule
 */
async function fullHealEveryMember(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule): Promise<void> {
	await healEveryMember(guildLike, stringInfos, guildDailyModule, true);
}

/**
 * Generic function to award a badge to members of a guild
 * @param guildLike
 * @param stringInfos
 * @param guildDailyModule
 */
async function awardGuildBadgeToMembers(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule): Promise<void> {
	let membersThatOwnTheBadge = 0;
	await genericAwardingFunction(guildLike.members, member => {
		if (!member.Player.addBadge(Constants.BADGES.POWERFUL_GUILD)) {
			membersThatOwnTheBadge++;
		}
	});
	if (membersThatOwnTheBadge === guildLike.members.length) {
		// everybody already has the badge, give something else instead
		return await healEveryMember(guildLike, stringInfos, guildDailyModule);
	}
	stringInfos.embed.setDescription(guildDailyModule.get("badge"));
	draftBotInstance.logsDatabase.logGuildDaily(guildLike.guild, GuildDailyConstants.REWARD_TYPES.BADGE).then();
}

/**
 * Generic function to award advance time to every member of a guild
 * @param guildLike
 * @param stringInfos
 * @param guildDailyModule
 */
async function advanceTimeOfEveryMember(guildLike: GuildLike, stringInfos: StringInfos, guildDailyModule: TranslationModule): Promise<void> {
	const timeAdvanced = Math.round(guildLike.guild.level * GuildDailyConstants.TIME_ADVANCED_MULTIPLIER);
	await genericAwardingFunction(guildLike.members, async member => await Maps.advanceTime(member.Player, hoursToMinutes(timeAdvanced), NumberChangeReason.GUILD_DAILY));
	stringInfos.embed.setDescription(guildDailyModule.format("hospital", {
		timeMoved: timeAdvanced
	}));
	draftBotInstance.logsDatabase.logGuildDaily(guildLike.guild, GuildDailyConstants.REWARD_TYPES.HOSPITAL).then();
}

/**
 * Map all possible rewards to the corresponding rewarding function
 */
function getMapOfAllRewardCommands(): Map<string, FunctionRewardType> {
	const linkToFunction = new Map<string, FunctionRewardType>();
	linkToFunction.set(GuildDailyConstants.REWARD_TYPES.PERSONAL_XP, awardPersonalXpToMembers);
	linkToFunction.set(GuildDailyConstants.REWARD_TYPES.GUILD_XP, awardGuildXp);
	linkToFunction.set(GuildDailyConstants.REWARD_TYPES.MONEY, awardMoneyToMembers);
	linkToFunction.set(GuildDailyConstants.REWARD_TYPES.PET_FOOD, awardCommonFood);
	linkToFunction.set(GuildDailyConstants.REWARD_TYPES.BADGE, awardGuildBadgeToMembers);
	linkToFunction.set(GuildDailyConstants.REWARD_TYPES.FULL_HEAL, fullHealEveryMember);
	linkToFunction.set(GuildDailyConstants.REWARD_TYPES.HOSPITAL, advanceTimeOfEveryMember);
	linkToFunction.set(GuildDailyConstants.REWARD_TYPES.PARTIAL_HEAL, healEveryMember);
	linkToFunction.set(GuildDailyConstants.REWARD_TYPES.ALTERATION, alterationHealEveryMember);
	return linkToFunction;
}

/**
 * Updates the guildDaily mission for each member of the guild and send a private message for those who have dms opened
 * @param members
 * @param interaction
 * @param language
 * @param guildDailyModule
 * @param embed
 */
async function notifyAndUpdatePlayers(members: Entity[], interaction: CommandInteraction, language: string, guildDailyModule: TranslationModule, embed: DraftBotEmbed): Promise<void> {
	for (const member of members) {
		const user = await draftBotClient.users.fetch(member.discordUserId);
		if (member.discordUserId !== interaction.user.id) {
			await MissionsController.update(member, interaction.channel, language, {missionId: "guildDailyFromSomeoneElse"});
		}
		await MissionsController.update(member, interaction.channel, language, {missionId: "guildDaily"});
		if (member.Player.dmNotification && member.discordUserId !== interaction.user.id) {
			sendDirectMessage(
				user,
				guildDailyModule.get("dmNotification.title"),

				guildDailyModule.format("dmNotification.description",
					{
						serveur: interaction.guild.name,
						pseudo: escapeUsername(interaction.user.username)
					}
				) + embed.data.description,
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
 * Allow to claim a daily guild reward
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 * @param forcedReward
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity, forcedReward: string = null): Promise<void> {
	const guildDailyModule = Translations.getModule("commands.guildDaily", language);
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const guild = await Guilds.getById(entity.Player.guildId);

	if (!guild) {
		return;
	}

	const time = millisecondsToHours(interaction.createdAt.valueOf() - guild.lastDailyAt.valueOf());
	if (time < GuildDailyConstants.TIME_BETWEEN_DAILIES && !forcedReward) {
		await replyErrorMessage(
			interaction,
			language,
			guildDailyModule.format("coolDown", {
				coolDownTime: GuildDailyConstants.TIME_BETWEEN_DAILIES,
				time: minutesDisplay(hoursToMinutes(GuildDailyConstants.TIME_BETWEEN_DAILIES - time))
			}));
		return;
	}

	const members = await Entities.getByGuild(guild.id);
	for (const member of members) {
		const blockingReasons = await BlockingUtils.getPlayerBlockingReason(member.discordUserId);
		if (blockingReasons.length < 2 && blockingReasons.includes(BlockingConstants.REASONS.FIGHT)) {
			continue;
		}
		if (await sendBlockedError(interaction, language, await draftBotClient.users.fetch(member.discordUserId))) {
			return;
		}
	}

	await interaction.deferReply();
	guild.lastDailyAt = new Date(interaction.createdTimestamp);
	await guild.save();

	const rewardType = forcedReward ?? generateRandomProperty(guild);

	const embed = await rewardPlayersOfTheGuild({guild, members}, language, interaction, rewardType);

	await notifyAndUpdatePlayers(members, interaction, language, guildDailyModule, embed);
}

const currentCommandFrenchTranslations = Translations.getModule("commands.guildDaily", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.guildDaily", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations,currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		requiredLevel: Constants.GUILD.REQUIRED_LEVEL,
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD],
		guildRequired: true
	},
	mainGuildCommand: false
};