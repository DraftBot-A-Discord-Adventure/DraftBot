import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Classes} from "../../core/models/Class";
import {Entities, Entity} from "../../core/models/Entity";
import {Guilds} from "../../core/models/Guild";
import Player, {Players} from "../../core/models/Player";
import {Campaign} from "../../core/missions/Campaign";
import {Constants} from "../../core/Constants";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Message, MessageReaction} from "discord.js";
import {Translations} from "../../core/Translations";
import Weapon from "../../core/models/Weapon";
import Armor from "../../core/models/Armor";
import Potion from "../../core/models/Potion";
import ObjectItem from "../../core/models/ObjectItem";
import {millisecondsToMinutes, minutesDisplay} from "../../core/utils/TimeUtils";
import {Data} from "../../core/Data";

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
		for (const badgeid in badges) {
			if (Object.prototype.hasOwnProperty.call(badges, badgeid)) {
				await msg.react(badges[badgeid]);
			}
		}
	}
}

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

	let titleEffect = askedEntity.Player.effect;
	const w = <Weapon>(await askedEntity.Player.getMainWeaponSlot().getItem());
	const a = <Armor>(await askedEntity.Player.getMainArmorSlot().getItem());
	const p = <Potion>(await askedEntity.Player.getMainPotionSlot().getItem());
	const o = <ObjectItem>(await askedEntity.Player.getMainObjectSlot().getItem());
	const [mc] = askedEntity.Player.MissionSlots.filter(m => m.isCampaign());
	const numberOfPlayers = await Player.count({
		where: {
			score: {
				[require("sequelize/lib/operators").gt]: 100
			}
		}
	});
	const rank = await Players.getRankById(askedEntity.Player.id);
	const fields = [
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
	if (askedEntity.Player.level >= Constants.CLASS.REQUIRED_LEVEL) {
		fields.push({
			name: profileModule.get("statistique.fieldName"),
			value: profileModule.format("statistique.fieldValue", {
				cumulativeAttack: await askedEntity.getCumulativeAttack(w, a, p, o),
				cumulativeDefense: await askedEntity.getCumulativeDefense(w, a, p, o),
				cumulativeSpeed: await askedEntity.getCumulativeSpeed(w, a, p, o),
				cumulativeHealth: await askedEntity.getCumulativeHealth(),
				cumulativeMaxHealth: await askedEntity.getMaxCumulativeHealth()
			}),
			inline: false
		});
	}
	fields.push(
		{
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
		});
	fields.push(
		{
			name: profileModule.get("ranking.fieldName"),
			value:
				profileModule.format("ranking.fieldValue", {
					rank: rank > numberOfPlayers ? profileModule.get("ranking.unranked") : rank,
					numberOfPlayer: numberOfPlayers,
					score: askedEntity.Player.score
				}),
			inline: false
		});

	if (!askedEntity.Player.checkEffect()) {
		if (interaction.createdAt >= askedEntity.Player.effectEndDate) {
			titleEffect = ":hospital:";
			fields.push({
				name: profileModule.get("timeLeft.fieldName"),
				value: profileModule.get("noTimeLeft.fieldValue"),
				inline: false
			});
		}
		else {
			fields.push({
				name: profileModule.get("timeLeft.fieldName"),
				value: profileModule.format("timeLeft.fieldValue", {
					effect: askedEntity.Player.effect,
					timeLeft: minutesDisplay(millisecondsToMinutes(askedEntity.Player.effectEndDate.valueOf() - interaction.createdAt.valueOf()))
				}),
				inline: false
			});
		}
	}

	try {
		const playerClass = await Classes.getById(askedEntity.Player.class);
		if (playerClass) {
			fields.push({
				name: profileModule.get("playerClass.fieldName"),
				value: profileModule.format("playerClass.fieldValue", {
					class: playerClass.getDataValue(language)
				}),
				inline: true
			});
		}
	}
	catch (error) {
		// TODO REFACTOR LES LOGS
		// log("Error while getting class of player for profile: " + error);
	}

	try {
		const guild = await Guilds.getById(askedEntity.Player.guildId);
		if (guild) {
			fields.push({
				name: profileModule.get("guild.fieldName"),
				value: profileModule.format("guild.fieldValue", {
					guild: guild.name
				}),
				inline: true
			});
		}
	}
	catch (error) {
		// TODO REFACTOR LES LOGS
		// log("Error while getting guild of player for profile: " + error);
	}

	try {
		const mapId = await askedEntity.Player.getDestinationId();
		if (mapId !== null) {
			fields.push({
				name: profileModule.get("map.fieldName"),
				value: (await askedEntity.Player.getDestination()).getDisplayName(language),
				inline: true
			});
		}
	}
	catch (error) {
		console.log(error);
	}

	try {
		const pet = askedEntity.Player.Pet;
		if (pet) {
			fields.push({
				name: profileModule.get("pet.fieldName"),
				value: profileModule.format("pet.fieldValue", {
					rarity: pet.PetModel.getRarityDisplay(),
					emote: pet.getPetEmote(),
					nickname: pet.nickname ? pet.nickname : pet.getPetTypeName(language)
				}),
				inline: false
			});
		}
	}
	catch (error) {
		console.log(error);
	}
	await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.setTitle(profileModule.format("title", {
					effect: titleEffect,
					pseudo: await askedEntity.Player.getPseudo(language),
					level: askedEntity.Player.level
				}))
				.addFields(fields)
		]
	});
	const msg = <Message> await interaction.fetchReply();

	const filterConfirm = (reaction: MessageReaction) => reaction.me && !reaction.users.cache.last().bot;

	const collector = msg.createReactionCollector({
		filter: filterConfirm,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: Data.getModule("commands.profile").getNumber("badgeMaxReactNumber")
	});

	collector.on("collect", async (reaction) => {
		if (reaction.emoji.name === Constants.PROFILE.DISPLAY_ALL_BADGE_EMOTE) {
			await sendMessageAllBadgesTooMuchBadges(askedEntity, language, interaction, msg);
		}
		else {
			msg.channel.send({content: profileModule.get("badges." + reaction.emoji.name)}).then((msg: Message) => {
				setTimeout(() => msg.delete(), Data.getModule("commands.profile").getNumber("badgeDescriptionTimeout"));
			});
		}
	});

	if (askedEntity.Player.badges !== null && askedEntity.Player.badges !== "") {
		await displayBadges(askedEntity, msg);
	}
	if (new Date().valueOf() - askedEntity.Player.topggVoteAt.valueOf() < Constants.TOPGG.BADGE_DURATION * 60 * 60 * 1000) {
		await msg.react(Constants.TOPGG.BADGE);
	}
}

/**
 * Envoie un message contenant les informations sur tous les badges de la personne concernée, si celle-ci possède trop de badges
 * @param {Entities} entity
 * @param {("fr"|"en")} language
 * @param interaction
 * @param msg
 * @returns {Promise<void>}
 */
async function sendMessageAllBadgesTooMuchBadges(entity: Entity, language: string, interaction: CommandInteraction, msg: Message) {
	let content = "";
	const badges = entity.Player.badges.split("-");
	const profileModule = Translations.getModule("commands.profile", language);
	for (const badgeSentence of badges) {
		content += profileModule.get("badges." + badgeSentence) + "\n";
	}
	interaction.followUp({
		embeds: [new DraftBotEmbed()
			.setTitle(profileModule.format("badgeDisplay.title", {
				pseudo: await entity.Player.getPseudo(language)
			}))
			.setDescription(content + profileModule.format("badgeDisplay.numberBadge", {
				badge: badges.length
			}))]
	});
	await msg.reactions.removeAll();
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("profile")
		.setDescription("Displays the profile of a player")
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to see the inventory")
			.setRequired(false)
		)
		.addNumberOption(option => option.setName("rank")
			.setDescription("The rank of the player you want to see the inventory")
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
