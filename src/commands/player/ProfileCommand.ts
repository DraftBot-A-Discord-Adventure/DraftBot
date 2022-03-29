import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Class, {Classes} from "../../core/models/Class";
import {Entities, Entity} from "../../core/models/Entity";
import Guild, {Guilds} from "../../core/models/Guild";
import {Players} from "../../core/models/Player";
import {Campaign} from "../../core/missions/Campaign";
import {Constants} from "../../core/Constants";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CacheType, CommandInteraction, Message, MessageReaction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import Weapon from "../../core/models/Weapon";
import Armor from "../../core/models/Armor";
import Potion from "../../core/models/Potion";
import ObjectItem from "../../core/models/ObjectItem";
import {hoursToMilliseconds, millisecondsToMinutes, minutesDisplay} from "../../core/utils/TimeUtils";
import {Data} from "../../core/Data";
import MissionSlot from "../../core/models/MissionSlot";
import PetEntity from "../../core/models/PetEntity";


/**
 * Displays information about the profile of the player who sent the command
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	let askedEntity = await Entities.getByOptions(interaction);
	if (!askedEntity) {
		askedEntity = entity;
	}
	const profileModule = Translations.getModule("commands.profile", language);
	const titleEffect = askedEntity.Player.effect;
	const fields = await generateFields(profileModule, askedEntity, interaction, titleEffect, language);
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
	const filterConfirm = (reaction: MessageReaction) => reaction.me && !reaction.users.cache.last().bot;

	const collector = reply.createReactionCollector({
		filter: filterConfirm,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: Data.getModule("commands.profile").getNumber("badgeMaxReactNumber")
	});

	collector.on("collect", async (reaction) => {
		if (reaction.emoji.name === Constants.PROFILE.DISPLAY_ALL_BADGE_EMOTE) {
			collector.stop(); // only one is allowed to avoid spam
			await sendMessageAllBadgesTooMuchBadges(askedEntity, language, interaction);
		}
		else {
			reply.channel.send({content: profileModule.get("badges." + reaction.emoji.name)}).then((msg: Message) => {
				setTimeout(() => msg.delete(), Data.getModule("commands.profile").getNumber("badgeDescriptionTimeout"));
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

async function generateFields(profileModule: TranslationModule, askedEntity: Entity, interaction: CommandInteraction<CacheType>, titleEffect: string, language: string) {
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
		// TODO REFACTOR LES LOGS
		// log("Error while getting class of player for profile: " + error);
	}

	try {
		const guild = await Guilds.getById(askedEntity.Player.guildId);
		if (guild) {
			fields.push(getGuildField(profileModule, guild));
		}
	}
	catch (error) {
		// TODO REFACTOR LES LOGS
		// log("Error while getting guild of player for profile: " + error);
	}

	try {
		const mapId = await askedEntity.Player.getDestinationId();
		if (mapId !== null) {
			fields.push(await getLocationField(profileModule, askedEntity, language));
		}
	}
	catch (error) {
		// TODO REFACTOR LES LOGS
		// log("Error while getting map of player for profile: " + error);
	}

	try {
		const pet = askedEntity.Player.Pet;
		if (pet) {
			fields.push(getPetField(profileModule, pet, language));
		}
	}
	catch (error) {
		// TODO REFACTOR LES LOGS
		// log("Error while getting pet of player for profile: " + error);
	}
	return fields;
}

/**
 * Display badges for the given entity
 * @param {Entities} entity
 * @param msg
 * @returns {Promise<void>}
 */
async function displayBadges(entity: Entity, msg: Message) {
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

async function getInformationField(profileModule: TranslationModule, askedEntity: Entity) {
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

async function getStatisticField(profileModule: TranslationModule, askedEntity: Entity, playerActiveObjects: { weapon: Weapon; potion: Potion; armor: Armor; object: ObjectItem }) {
	return {
		name: profileModule.get("statistique.fieldName"),
		value: profileModule.format("statistique.fieldValue", {
			cumulativeAttack: await askedEntity.getCumulativeAttack(playerActiveObjects),
			cumulativeDefense: await askedEntity.getCumulativeDefense(playerActiveObjects),
			cumulativeSpeed: await askedEntity.getCumulativeSpeed(playerActiveObjects),
			cumulativeHealth: await askedEntity.getCumulativeHealth(),
			cumulativeMaxHealth: await askedEntity.getMaxCumulativeHealth()
		}),
		inline: false
	};
}

function getMissionField(profileModule: TranslationModule, askedEntity: Entity, mc: MissionSlot) {
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

function getRankingField(profileModule: TranslationModule, rank: number, numberOfPlayers: number, askedEntity: Entity) {
	return {
		name: profileModule.get("ranking.fieldName"),
		value:
			profileModule.format("ranking.fieldValue", {
				rank: rank > numberOfPlayers ? profileModule.get("ranking.unranked") : rank,
				numberOfPlayer: numberOfPlayers,
				score: askedEntity.Player.score
			}),
		inline: false
	};
}

function getClassField(profileModule: TranslationModule, playerClass: Class, language: string) {
	return {
		name: profileModule.get("playerClass.fieldName"),
		value: profileModule.format("playerClass.fieldValue", {
			class: playerClass.getDataValue(language)
		}),
		inline: true
	};
}

function getGuildField(profileModule: TranslationModule, guild: Guild) {
	return {
		name: profileModule.get("guild.fieldName"),
		value: profileModule.format("guild.fieldValue", {
			guild: guild.name
		}),
		inline: true
	};
}

async function getLocationField(profileModule: TranslationModule, askedEntity: Entity, language: string) {
	return {
		name: profileModule.get("map.fieldName"),
		value: (await askedEntity.Player.getDestination()).getDisplayName(language),
		inline: true
	};
}

function getPetField(profileModule: TranslationModule, pet: PetEntity, language: string) {
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

function getTimeLeftField(profileModule: TranslationModule, askedEntity: Entity, interaction: CommandInteraction<CacheType>) {
	return {
		name: profileModule.get("timeLeft.fieldName"),
		value: profileModule.format("timeLeft.fieldValue", {
			effect: askedEntity.Player.effect,
			timeLeft: minutesDisplay(millisecondsToMinutes(askedEntity.Player.effectEndDate.valueOf() - interaction.createdAt.valueOf()))
		}),
		inline: false
	};
}

function getNoTimeLeftField(profileModule: TranslationModule) {
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
async function sendMessageAllBadgesTooMuchBadges(entity: Entity, language: string, interaction: CommandInteraction) {
	let content = "";
	const badges = entity.Player.badges.split("-");
	const profileModule = Translations.getModule("commands.profile", language);
	for (const badgeSentence of badges) {
		content += profileModule.get("badges." + badgeSentence) + "\n";
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

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("profile")
		.setDescription("Displays the profile of a player")
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
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: [Constants.EFFECT.BABY],
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};
