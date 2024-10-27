import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {
	CommandProfilePacketReq,
	CommandProfilePacketRes
} from "../../../../Lib/src/packets/commands/CommandProfilePacket";
import {SlashCommandBuilder} from "@discordjs/builders";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {ColorResolvable, EmbedField, Message, MessageReaction} from "discord.js";
import {Constants} from "../../../../Lib/src/constants/Constants";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed";
import {ProfileConstants} from "../../../../Lib/src/constants/ProfileConstants";
import {Language} from "../../../../Lib/src/Language";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {PetUtils} from "../../utils/PetUtils";
import {ClassUtils} from "../../utils/ClassUtils";
import {EmoteUtils} from "../../utils/EmoteUtils";

/**
 * Display the profile of a player
 */
async function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<CommandProfilePacketReq | null> {
	let askedPlayer: { keycloakId?: string, rank?: number } = {keycloakId: keycloakUser.id};

	const user = interaction.options.getUser("user");
	if (user) {
		const keycloakId = await KeycloakUtils.getKeycloakIdFromDiscordId(keycloakConfig, user.id, user.displayName);
		if (!keycloakId) {
			await interaction.reply({embeds: [new DraftBotErrorEmbed(interaction.user, interaction, i18n.t("error:playerDoesntExist", {lng: interaction.userLanguage}))]});
			return null;
		}
		askedPlayer = {keycloakId};
	}
	const rank = interaction.options.get("rank");
	if (rank) {
		askedPlayer = {rank: <number>rank.value};
	}

	return makePacket(CommandProfilePacketReq, {askedPlayer});
}

async function sendMessageAllBadgesTooMuchBadges(gameUsername: string, badges: string[], interaction: DraftbotInteraction): Promise<void> {
	let content = "";
	for (const badgeSentence of badges) {
		content += `${i18n.t(`commands:profile.badges.${badgeSentence}`, {lng: interaction.userLanguage})}\n`;
	}
	await interaction.followUp({
		embeds: [new DraftBotEmbed()
			.setTitle(i18n.t("commands:profile.badgeDisplay.title", {
				lng: interaction.userLanguage,
				pseudo: gameUsername
			}))
			.setDescription(content + i18n.t("commands:profile.badgeDisplay.numberBadge", {
				lng: interaction.userLanguage,
				badge: badges.length
			}))]
	});
}

async function displayBadges(badges: string[], msg: Message): Promise<void> {
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

function generateFields(packet: CommandProfilePacketRes, lng: Language): EmbedField[] {
	const fields: EmbedField[] = [];

	fields.push({
		name: i18n.t("commands:profile.information.fieldName", {lng}),
		value: i18n.t("commands:profile.information.fieldValue", {
			lng,
			health: packet.data?.health.value,
			maxHealth: packet.data?.health.max,
			money: packet.data?.money,
			experience: packet.data?.experience.value,
			experienceNeededToLevelUp: packet.data?.experience.max
		}),
		inline: false
	});

	if (packet.data?.stats) {
		fields.push({
			name: i18n.t("commands:profile.statistics.fieldName", {lng}),
			value: i18n.t("commands:profile.statistics.fieldValue", {
				lng,
				baseBreath: packet.data?.stats.breath.base,
				breathRegen: packet.data?.stats.breath.regen,
				cumulativeAttack: packet.data?.stats.attack,
				cumulativeDefense: packet.data?.stats.defense,
				cumulativeHealth: packet.data.stats.energy.value,
				cumulativeSpeed: packet.data.stats.speed,
				cumulativeMaxHealth: packet.data.stats.energy.max,
				maxBreath: packet.data.stats.breath.max
			}),
			inline: false
		});
	}

	fields.push({
		name: i18n.t("commands:profile.mission.fieldName", {lng}),
		value: i18n.t("commands:profile.mission.fieldValue", {
			lng,
			gems: packet.data?.missions.gems,
			campaign: packet.data?.missions.campaignProgression
		}),
		inline: false
	});

	fields.push({
		name: i18n.t("commands:profile.ranking.fieldName", {lng}),
		value: packet.data?.rank.unranked ? i18n.t("commands:profile.ranking.fieldValueUnranked", {
			lng,
			score: packet.data.rank.score
		}) : i18n.t("commands:profile.ranking.fieldValue", {
			lng,
			rank: packet.data?.rank.rank,
			numberOfPlayer: packet.data?.rank.numberOfPlayers,
			score: packet.data?.rank.score
		}),
		inline: false
	});

	if (packet.data?.effect?.healed) {
		fields.push({
			name: i18n.t("commands:profile.noTimeLeft.fieldName", {lng}),
			value: i18n.t("commands:profile.noTimeLeft.fieldValue", {
				lng
			}),
			inline: false
		});
	}
	else if (packet.data?.effect) {
		fields.push({
			name: i18n.t("commands:profile.timeLeft.fieldName", {lng}),
			value: i18n.t("commands:profile.timeLeft.fieldValue", {
				lng,
				effect: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.effects[packet.data.effect.effect]),
				timeLeft: packet.data.effect.timeLeft
			}),
			inline: false
		});
	}

	if (packet.data?.classId) {
		fields.push({
			name: i18n.t("commands:profile.playerClass.fieldName", {lng}),
			value: i18n.t("commands:profile.playerClass.field", {
				lng,
				className: ClassUtils.classToString(lng, packet.data.classId)
			}),
			inline: false
		});
	}

	if (packet.data?.fightRanking) {
		fields.push({
			name: i18n.t("commands:profile.fightRanking.fieldName", {lng}),
			value: i18n.t("commands:profile.fightRanking.fieldValue", {
				lng,
				league: packet.data.fightRanking.league,
				gloryPoints: packet.data.fightRanking.glory
			}),
			inline: false
		});
	}

	if (packet.data?.guild) {
		fields.push({
			name: i18n.t("commands:profile.guild.fieldName", {lng}),
			value: i18n.t("commands:profile.guild.fieldValue", {
				lng,
				guild: packet.data.guild
			}),
			inline: false
		});
	}

	if (packet.data?.destinationId && packet.data?.mapTypeId) {
		fields.push({
			name: i18n.t("commands:profile.map.fieldName", {lng}),
			value: i18n.t("commands:profile.map.fieldValue", {
				lng,
				mapEmote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.map_types[packet.data.mapTypeId]),
				mapName: i18n.t(`models:map_locations.${packet.data.destinationId}.name`, {lng})
			}),
			inline: false
		});
	}

	if (packet.data?.pet) {
		fields.push({
			name: i18n.t("commands:profile.pet.fieldName", {lng}),
			value: i18n.t("commands:profile.pet.fieldValue", {
				lng,
				emote: PetUtils.getPetIcon(packet.data.pet.typeId, packet.data.pet.sex),
				rarity: PetUtils.getRarityDisplay(packet.data.pet.rarity)
			}) + PetUtils.petToShortString(lng, packet.data.pet.nickname, packet.data.pet.typeId, packet.data.pet.sex),
			inline: false
		});
	}

	return fields;
}

export async function handleCommandProfilePacketRes(packet: CommandProfilePacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (interaction) {
		if (!packet.foundPlayer) {
			await interaction.reply({
				embeds: [
					new DraftBotErrorEmbed(
						interaction.user,
						interaction,
						i18n.t("error:playerDoesntExist", {lng: interaction.userLanguage})
					)
				]
			});
			return;
		}

		const keycloakUser = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.keycloakId!))!;

		const titleEffect = packet.data?.effect?.healed ? Constants.DEFAULT_HEALED_EFFECT : packet.data?.effect;
		const reply = await interaction.reply({
			embeds: [
				new DraftBotEmbed()
					.setColor(<ColorResolvable>packet.data!.color)
					.setTitle(i18n.t("commands:profile.title", {
						lng: interaction.userLanguage,
						effect: titleEffect,
						pseudo: keycloakUser.attributes.gameUsername,
						level: packet.data?.level
					}))
					.addFields(generateFields(packet, interaction.userLanguage))
			],
			fetchReply: true
		}) as Message;

		const collector = reply.createReactionCollector({
			filter: (reaction: MessageReaction) => reaction.me && !reaction.users.cache.last()!.bot,
			time: Constants.MESSAGES.COLLECTOR_TIME,
			max: ProfileConstants.BADGE_MAXIMUM_REACTION
		});

		collector.on("collect", async (reaction) => {
			if (reaction.emoji.name === Constants.PROFILE.DISPLAY_ALL_BADGE_EMOTE) {
				collector.stop(); // Only one is allowed to avoid spam
				await sendMessageAllBadgesTooMuchBadges(keycloakUser.attributes.gameUsername, packet.data!.badges!, interaction);
			}
			else {
				interaction.channel.send({content: i18n.t(`commands:profile.badges.${reaction.emoji.name}`, {lng: interaction.userLanguage})})
					.then((msg: Message | null) => {
						setTimeout(() => msg?.delete(), ProfileConstants.BADGE_DESCRIPTION_TIMEOUT);
					});
			}
		});

		if (packet.data?.badges.length !== 0) {
			await displayBadges(packet.data!.badges, reply);
		}
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("profile")
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateOption("profile", "user", option)
				.setRequired(false))
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateOption("profile", "rank", option)
				.setRequired(false)) as SlashCommandBuilder,
	getPacket,
	requirements: {
		disallowEffects: [Effect.NOT_STARTED]
	},
	mainGuildCommand: false
};