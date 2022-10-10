import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Class, {Classes} from "../../core/database/game/models/Class";
import Guild, {Guilds} from "../../core/database/game/models/Guild";
import {Player, Players} from "../../core/database/game/models/Player";
import {Campaign} from "../../core/missions/Campaign";
import {Constants} from "../../core/Constants";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, EmbedField, Message, MessageReaction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import {hoursToMilliseconds, millisecondsToMinutes, minutesDisplay} from "../../core/utils/TimeUtils";
import MissionSlot, {MissionSlots} from "../../core/database/game/models/MissionSlot";
import PetEntity, {PetEntities} from "../../core/database/game/models/PetEntity";
import {playerActiveObjects} from "../../core/database/game/models/PlayerActiveObjects";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {ProfileConstants} from "../../core/constants/ProfileConstants";
import {log} from "console";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import PlayerMissionsInfo, {PlayerMissionsInfos} from "../../core/database/game/models/PlayerMissionsInfo";
import Pet, {Pets} from "../../core/database/game/models/Pet";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";

/**
 * Display badges for the given player
 * @param {Player} player
 * @param msg
 * @returns {Promise<void>}
 */
async function displayBadges(player: Player, msg: Message): Promise<void> {
	const badges = player.badges.split("-");
	if (badges.length >= Constants.PROFILE.MAX_EMOTE_DISPLAY_NUMBER) {
		await msg.react(Constants.PROFILE.DISPLAY_ALL_BADGE_EMOTE);
	}
	else {
		for (const badgeId in badges) {
			if (Object.prototype.hasOwnProperty.call(badges, badgeId)) {
				await msg.react(badges[badgeId]);
			}
		}
	}
}

/**
 * Get the information field of the profile
 * @param profileModule
 * @param askedPlayer
 */
async function getInformationField(profileModule: TranslationModule, askedPlayer: Player): Promise<EmbedField[]> {
	return [
		{
			name: profileModule.get("information.fieldName"),
			value: profileModule.format("information.fieldValue", {
				health: askedPlayer.health,
				maxHealth: await askedPlayer.getMaxHealth(),
				experience: askedPlayer.experience,
				experienceNeededToLevelUp: askedPlayer.getExperienceNeededToLevelUp(),
				money: askedPlayer.money
			}),
			inline: false
		}];
}

/**
 * Get the statistic field of the profile
 * @param profileModule
 * @param askedPlayer
 * @param playerActiveObjects
 */
async function getStatisticField(profileModule: TranslationModule, askedPlayer: Player, playerActiveObjects: playerActiveObjects): Promise<EmbedField> {
	return {
		name: profileModule.get("statistique.fieldName"),
		value: profileModule.format("statistique.fieldValue", {
			cumulativeAttack: await askedPlayer.getCumulativeAttack(playerActiveObjects),
			cumulativeDefense: await askedPlayer.getCumulativeDefense(playerActiveObjects),
			cumulativeSpeed: await askedPlayer.getCumulativeSpeed(playerActiveObjects),
			cumulativeHealth: await askedPlayer.getCumulativeFightPoint(),
			cumulativeMaxHealth: await askedPlayer.getMaxCumulativeFightPoint()
		}),
		inline: false
	};
}

/**
 * get the current campaign progression of the player
 * @param askedPlayer
 * @param mc
 * @param missionsInfo
 */
function getCampaignProgression(askedPlayer: Player, mc: MissionSlot, missionsInfo: PlayerMissionsInfo): number {
	return Math.round((missionsInfo.campaignProgression ===
		Campaign.getMaxCampaignNumber() &&
		mc.isCompleted() ? missionsInfo.campaignProgression : missionsInfo.campaignProgression - 1
	) / Campaign.getMaxCampaignNumber() * 100);
}

/**
 * Get the mission field of the profile
 * @param profileModule
 * @param askedPlayer
 * @param mc
 * @param missionsInfo
 */
function getMissionField(profileModule: TranslationModule, askedPlayer: Player, mc: MissionSlot, missionsInfo: PlayerMissionsInfo): EmbedField {
	return {
		name: profileModule.get("mission.fieldName"),
		value: profileModule.format("mission.fieldValue",
			{
				gems: missionsInfo.gems,
				campaign: getCampaignProgression(askedPlayer, mc, missionsInfo)
			}
		),
		inline: false
	};
}

/**
 * Get the ranking field of the profile
 * @param profileModule
 * @param rank
 * @param numberOfPlayers
 * @param askedPlayer
 */
function getRankingField(profileModule: TranslationModule, rank: number, numberOfPlayers: number, askedPlayer: Player): EmbedField {
	const isUnranked = rank > numberOfPlayers;
	return {
		name: profileModule.get("ranking.fieldName"),
		value:
			profileModule.format("ranking.fieldValue", {
				isUnranked: isUnranked,
				rank: isUnranked ? profileModule.get("ranking.unranked") : rank,
				numberOfPlayer: isUnranked ? "" : numberOfPlayers,
				score: askedPlayer.score
			}),
		inline: false
	};
}

/**
 * Get the class field of the profile
 * @param profileModule
 * @param playerClass
 * @param language
 */
function getClassField(profileModule: TranslationModule, playerClass: Class, language: string): EmbedField {
	return {
		name: profileModule.get("playerClass.fieldName"),
		value: profileModule.format("playerClass.fieldValue", {
			class: playerClass.getDataValue(language)
		}),
		inline: true
	};
}

/**
 * Get the guild field of the profile
 * @param profileModule
 * @param guild
 */
function getGuildField(profileModule: TranslationModule, guild: Guild): EmbedField {
	return {
		name: profileModule.get("guild.fieldName"),
		value: profileModule.format("guild.fieldValue", {
			guild: guild.name
		}),
		inline: true
	};
}

/**
 * Get the location field of the profile
 * @param profileModule
 * @param askedPlayer
 * @param language
 */
async function getLocationField(profileModule: TranslationModule, askedPlayer: Player, language: string): Promise<EmbedField> {
	return {
		name: profileModule.get("map.fieldName"),
		value: (await askedPlayer.getDestination()).getDisplayName(language),
		inline: true
	};
}

/**
 * Get the pet field of the profile
 * @param profileModule
 * @param pet
 * @param petModel
 * @param language
 */
function getPetField(profileModule: TranslationModule, pet: PetEntity, petModel: Pet, language: string): EmbedField {
	return {
		name: profileModule.get("pet.fieldName"),
		value: profileModule.format("pet.fieldValue", {
			rarity: petModel.getRarityDisplay(),
			emote: pet.getPetEmote(petModel),
			nickname: pet.nickname ? pet.nickname : pet.getPetTypeName(petModel, language)
		}),
		inline: false
	};
}

/**
 * Get the time left field of the profile
 * @param profileModule
 * @param askedPlayer
 * @param interaction
 */
function getTimeLeftField(profileModule: TranslationModule, askedPlayer: Player, interaction: CommandInteraction): EmbedField {
	return {
		name: profileModule.get("timeLeft.fieldName"),
		value: profileModule.format("timeLeft.fieldValue", {
			effect: askedPlayer.effect,
			timeLeft: minutesDisplay(millisecondsToMinutes(askedPlayer.effectEndDate.valueOf() - interaction.createdAt.valueOf()))
		}),
		inline: false
	};
}

/**
 * Get the no time left field of the profile
 * @param profileModule
 */
function getNoTimeLeftField(profileModule: TranslationModule): EmbedField {
	return {
		name: profileModule.get("timeLeft.fieldName"),
		value: profileModule.get("noTimeLeft.fieldValue"),
		inline: false
	};
}

/**
 * Envoie un message contenant les informations sur tous les badges de la personne concernée, si celle-ci possède trop de badges
 * @param {Player} player
 * @param {("fr"|"en")} language
 * @param interaction
 * @returns {Promise<void>}
 */
async function sendMessageAllBadgesTooMuchBadges(player: Player, language: string, interaction: CommandInteraction): Promise<void> {
	let content = "";
	const badges = player.badges.split("-");
	const profileModule = Translations.getModule("commands.profile", language);
	for (const badgeSentence of badges) {
		content += profileModule.get(`badges.${badgeSentence}`) + "\n";
	}
	await interaction.followUp({
		embeds: [new DraftBotEmbed()
			.setTitle(profileModule.format("badgeDisplay.title", {
				pseudo: player.getPseudo(language)
			}))
			.setDescription(content + profileModule.format("badgeDisplay.numberBadge", {
				badge: badges.length
			}))]
	});
}

/**
 * Generates all the fields for the profile command
 * @param profileModule
 * @param askedPlayer
 * @param interaction
 * @param titleEffect
 * @param language
 */
async function generateFields(
	profileModule: TranslationModule,
	askedPlayer: Player,
	interaction: CommandInteraction,
	titleEffect: string,
	language: string
): Promise<{ fields: EmbedField[], titleEffect: string }> {
	const playerActiveObjects = await InventorySlots.getMainSlotsItems(askedPlayer.id);
	const missionSlots = await MissionSlots.getOfPlayer(askedPlayer.id);
	const [mc] = missionSlots.filter(m => m.isCampaign());
	const rank = await Players.getRankById(askedPlayer.id);
	const numberOfPlayers = await Players.getNbPlayersHaveStartedTheAdventure();
	const fields = await getInformationField(profileModule, askedPlayer);
	const missionsInfo = await PlayerMissionsInfos.getOfPlayer(askedPlayer.id);
	if (askedPlayer.level >= Constants.CLASS.REQUIRED_LEVEL) {
		fields.push(await getStatisticField(profileModule, askedPlayer, playerActiveObjects));
	}
	fields.push(
		getMissionField(profileModule, askedPlayer, mc, missionsInfo));
	fields.push(
		getRankingField(profileModule, rank, numberOfPlayers, askedPlayer));

	if (!askedPlayer.checkEffect()) {
		if (interaction.createdAt >= askedPlayer.effectEndDate) {
			titleEffect = Constants.DEFAULT_HEALED_EFFECT;
			fields.push(getNoTimeLeftField(profileModule));
		}
		else {
			fields.push(getTimeLeftField(profileModule, askedPlayer, interaction));
		}
	}

	try {
		const playerClass = await Classes.getById(askedPlayer.class);
		if (playerClass) {
			fields.push(getClassField(profileModule, playerClass, language));
		}
	}
	catch (error) {
		log(`Error while getting class of player for profile: ${error}`);
	}

	try {
		const guild = await Guilds.getById(askedPlayer.guildId);
		if (guild) {
			fields.push(getGuildField(profileModule, guild));
		}
	}
	catch (error) {
		log(`Error while getting guild of player for profile: ${error}`);
	}

	try {
		const mapId = await askedPlayer.getDestinationId();
		if (mapId !== null) {
			fields.push(await getLocationField(profileModule, askedPlayer, language));
		}
	}
	catch (error) {
		log(`Error while getting map of player for profile: ${error}`);
	}

	try {
		const petEntity = await PetEntities.getById(askedPlayer.petId);
		const petModel = await Pets.getById(petEntity.petId);
		if (petEntity) {
			fields.push(getPetField(profileModule, petEntity, petModel, language));
		}
	}
	catch (error) {
		log(`Error while getting pet of player for profile: ${error}`);
	}
	return {fields, titleEffect};
}

/**
 * Displays information about the profile of the player who sent the command
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	let askedEntity = await Players.getByOptions(interaction);
	if (!askedEntity) {
		askedEntity = player;
	}
	const profileModule = Translations.getModule("commands.profile", language);
	const {
		fields,
		titleEffect
	} = await generateFields(profileModule, askedEntity, interaction, askedEntity.effect, language);
	const reply = await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.setTitle(profileModule.format("title", {
					effect: titleEffect,
					pseudo: askedEntity.getPseudo(language),
					level: askedEntity.level
				}))
				.addFields(fields)
		],
		fetchReply: true
	}) as Message;

	const collector = reply.createReactionCollector({
		filter: (reaction: MessageReaction) => reaction.me && !reaction.users.cache.last().bot,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: ProfileConstants.BADGE_MAXIMUM_REACTION
	});

	collector.on("collect", async (reaction) => {
		if (reaction.emoji.name === Constants.PROFILE.DISPLAY_ALL_BADGE_EMOTE) {
			collector.stop(); // only one is allowed to avoid spam
			await sendMessageAllBadgesTooMuchBadges(askedEntity, language, interaction);
		}
		else {
			reply.channel.send({content: profileModule.get(`badges.${reaction.emoji.name}`)}).then((msg: Message) => {
				setTimeout(() => msg.delete(), ProfileConstants.BADGE_DESCRIPTION_TIMEOUT);
			});
		}
	});

	if (askedEntity.badges !== null && askedEntity.badges !== "") {
		await displayBadges(askedEntity, reply);
	}
	if (new Date().valueOf() - askedEntity.topggVoteAt.valueOf() < hoursToMilliseconds(Constants.TOPGG.BADGE_DURATION)) {
		await reply.react(Constants.TOPGG.BADGE);
	}
}

const currentCommandFrenchTranslations = Translations.getModule("commands.profile", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.profile", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateUserOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		)
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateRankOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY]
	},
	mainGuildCommand: false
};