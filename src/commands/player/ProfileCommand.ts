import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Class, {Classes} from "../../core/database/game/models/Class";
import {Entities, Entity} from "../../core/database/game/models/Entity";
import Guild, {Guilds} from "../../core/database/game/models/Guild";
import {Players} from "../../core/database/game/models/Player";
import {Campaign} from "../../core/missions/Campaign";
import {Constants} from "../../core/Constants";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, EmbedField, Message, MessageReaction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import {hoursToMilliseconds, millisecondsToMinutes, minutesDisplay} from "../../core/utils/TimeUtils";
import MissionSlot from "../../core/database/game/models/MissionSlot";
import PetEntity from "../../core/database/game/models/PetEntity";
import {playerActiveObjects} from "../../core/database/game/models/PlayerActiveObjects";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {ProfileConstants} from "../../core/constants/ProfileConstants";
import {log} from "console";

/**
 * Display badges for the given entity
 * @param {Entities} entity
 * @param msg
 * @returns {Promise<void>}
 */
async function displayBadges(entity: Entity, msg: Message): Promise<void> {
	const badges = entity.Player.badges.split("-");
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
 * @param askedEntity
 */
async function getInformationField(profileModule: TranslationModule, askedEntity: Entity): Promise<EmbedField[]> {
	return [
		{
			name: profileModule.get("information.fieldName"),
			value: profileModule.format("information.fieldValue", {
				health: askedEntity.health,
				maxHealth: await askedEntity.getMaxHealth(),
				experience: askedEntity.Player.experience,
				experienceNeededToLevelUp: askedEntity.Player.getExperienceNeededToLevelUp(),
				money: askedEntity.Player.money
			}),
			inline: false
		}];
}

/**
 * Get the statistic field of the profile
 * @param profileModule
 * @param askedEntity
 * @param playerActiveObjects
 */
async function getStatisticField(profileModule: TranslationModule, askedEntity: Entity, playerActiveObjects: playerActiveObjects): Promise<EmbedField> {
	return {
		name: profileModule.get("statistique.fieldName"),
		value: profileModule.format("statistique.fieldValue", {
			cumulativeAttack: await askedEntity.getCumulativeAttack(playerActiveObjects),
			cumulativeDefense: await askedEntity.getCumulativeDefense(playerActiveObjects),
			cumulativeSpeed: await askedEntity.getCumulativeSpeed(playerActiveObjects),
			cumulativeHealth: await askedEntity.getCumulativeFightPoint(),
			cumulativeMaxHealth: await askedEntity.getMaxCumulativeFightPoint()
		}),
		inline: false
	};
}

/**
 * Get the mission field of the profile
 * @param profileModule
 * @param askedEntity
 * @param mc
 */
function getMissionField(profileModule: TranslationModule, askedEntity: Entity, mc: MissionSlot): EmbedField {
	return {
		name: profileModule.get("mission.fieldName"),
		value: profileModule.format("mission.fieldValue", {
			gems: askedEntity.Player.PlayerMissionsInfo.gems,
			campaign: Math.round(
				(askedEntity.Player.PlayerMissionsInfo.campaignProgression ===
						Campaign.getMaxCampaignNumber() && mc.isCompleted() ? askedEntity.Player.PlayerMissionsInfo.campaignProgression
					: askedEntity.Player.PlayerMissionsInfo.campaignProgression - 1
				) / Campaign.getMaxCampaignNumber() * 100)
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
 * @param askedEntity
 */
function getRankingField(profileModule: TranslationModule, rank: number, numberOfPlayers: number, askedEntity: Entity): EmbedField {
	const isUnranked = rank > numberOfPlayers;
	return {
		name: profileModule.get("ranking.fieldName"),
		value:
			profileModule.format("ranking.fieldValue", {
				isUnranked: isUnranked,
				rank: isUnranked ? profileModule.get("ranking.unranked") : rank,
				numberOfPlayer: isUnranked ? "" : numberOfPlayers,
				score: askedEntity.Player.score
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
 * @param askedEntity
 * @param language
 */
async function getLocationField(profileModule: TranslationModule, askedEntity: Entity, language: string): Promise<EmbedField> {
	return {
		name: profileModule.get("map.fieldName"),
		value: (await askedEntity.Player.getDestination()).getDisplayName(language),
		inline: true
	};
}

/**
 * Get the pet field of the profile
 * @param profileModule
 * @param pet
 * @param language
 */
function getPetField(profileModule: TranslationModule, pet: PetEntity, language: string): EmbedField {
	return {
		name: profileModule.get("pet.fieldName"),
		value: profileModule.format("pet.fieldValue", {
			rarity: pet.PetModel.getRarityDisplay(),
			emote: pet.getPetEmote(),
			nickname: pet.nickname ? pet.nickname : pet.getPetTypeName(language)
		}),
		inline: false
	};
}

/**
 * Get the time left field of the profile
 * @param profileModule
 * @param askedEntity
 * @param interaction
 */
function getTimeLeftField(profileModule: TranslationModule, askedEntity: Entity, interaction: CommandInteraction): EmbedField {
	return {
		name: profileModule.get("timeLeft.fieldName"),
		value: profileModule.format("timeLeft.fieldValue", {
			effect: askedEntity.Player.effect,
			timeLeft: minutesDisplay(millisecondsToMinutes(askedEntity.Player.effectEndDate.valueOf() - interaction.createdAt.valueOf()))
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
 * @param {Entities} entity
 * @param {("fr"|"en")} language
 * @param interaction
 * @returns {Promise<void>}
 */
async function sendMessageAllBadgesTooMuchBadges(entity: Entity, language: string, interaction: CommandInteraction): Promise<void> {
	let content = "";
	const badges = entity.Player.badges.split("-");
	const profileModule = Translations.getModule("commands.profile", language);
	for (const badgeSentence of badges) {
		content += profileModule.get(`badges.${badgeSentence}`) + "\n";
	}
	await interaction.followUp({
		embeds: [new DraftBotEmbed()
			.setTitle(profileModule.format("badgeDisplay.title", {
				pseudo: await entity.Player.getPseudo(language)
			}))
			.setDescription(content + profileModule.format("badgeDisplay.numberBadge", {
				badge: badges.length
			}))]
	});
}

/**
 * Generates all the fields for the profile command
 * @param profileModule
 * @param askedEntity
 * @param interaction
 * @param titleEffect
 * @param language
 */
async function generateFields(
	profileModule: TranslationModule,
	askedEntity: Entity,
	interaction: CommandInteraction,
	titleEffect: string,
	language: string
): Promise<{ fields: EmbedField[], titleEffect: string }> {
	const playerActiveObjects = await askedEntity.Player.getMainSlotsItems();
	const [mc] = askedEntity.Player.MissionSlots.filter(m => m.isCampaign());
	const rank = await Players.getRankById(askedEntity.Player.id);
	const numberOfPlayers = await Players.getNbPlayersHaveStartedTheAdventure();
	const fields = await getInformationField(profileModule, askedEntity);
	if (askedEntity.Player.level >= Constants.CLASS.REQUIRED_LEVEL) {
		fields.push(await getStatisticField(profileModule, askedEntity, playerActiveObjects));
	}
	fields.push(
		getMissionField(profileModule, askedEntity, mc));
	fields.push(
		getRankingField(profileModule, rank, numberOfPlayers, askedEntity));

	if (!askedEntity.Player.checkEffect()) {
		if (interaction.createdAt >= askedEntity.Player.effectEndDate) {
			titleEffect = Constants.DEFAULT_HEALED_EFFECT;
			fields.push(getNoTimeLeftField(profileModule));
		}
		else {
			fields.push(getTimeLeftField(profileModule, askedEntity, interaction));
		}
	}

	try {
		const playerClass = await Classes.getById(askedEntity.Player.class);
		if (playerClass) {
			fields.push(getClassField(profileModule, playerClass, language));
		}
	}
	catch (error) {
		log(`Error while getting class of player for profile: ${error}`);
	}

	try {
		const guild = await Guilds.getById(askedEntity.Player.guildId);
		if (guild) {
			fields.push(getGuildField(profileModule, guild));
		}
	}
	catch (error) {
		log(`Error while getting guild of player for profile: ${error}`);
	}

	try {
		const mapId = await askedEntity.Player.getDestinationId();
		if (mapId !== null) {
			fields.push(await getLocationField(profileModule, askedEntity, language));
		}
	}
	catch (error) {
		log(`Error while getting map of player for profile: ${error}`);
	}

	try {
		const pet = askedEntity.Player.Pet;
		if (pet) {
			fields.push(getPetField(profileModule, pet, language));
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
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	let askedEntity = await Entities.getByOptions(interaction);
	if (!askedEntity) {
		askedEntity = entity;
	}
	const profileModule = Translations.getModule("commands.profile", language);
	const {
		fields,
		titleEffect
	} = await generateFields(profileModule, askedEntity, interaction, askedEntity.Player.effect, language);
	const reply = await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.setTitle(profileModule.format("title", {
					effect: titleEffect,
					pseudo: await askedEntity.Player.getPseudo(language),
					level: askedEntity.Player.level
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

	if (askedEntity.Player.badges !== null && askedEntity.Player.badges !== "") {
		await displayBadges(askedEntity, reply);
	}
	if (new Date().valueOf() - askedEntity.Player.topggVoteAt.valueOf() < hoursToMilliseconds(Constants.TOPGG.BADGE_DURATION)) {
		await reply.react(Constants.TOPGG.BADGE);
	}
}

const currentCommandFrenchTranslations = Translations.getModule("commands.profile", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.profile", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName(currentCommandEnglishTranslations.get("commandName"))
		.setNameLocalizations({
			fr: currentCommandFrenchTranslations.get("commandName")
		})
		.setDescription(currentCommandEnglishTranslations.get("commandDescription"))
		.setDescriptionLocalizations({
			fr: currentCommandFrenchTranslations.get("commandDescription")
		})
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to see the profile")
			.setRequired(false)
		)
		.addNumberOption(option => option.setName("rank")
			.setDescription("The rank of the player you want to see the profile")
			.setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY]
	},
	mainGuildCommand: false
};