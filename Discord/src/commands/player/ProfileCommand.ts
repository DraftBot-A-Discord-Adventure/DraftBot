import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n, {TranslationOption} from "../../translations/i18n";
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
import {ProfileConstants} from "../../../../Lib/src/constants/ProfileConstants";
import {Language} from "../../../../Lib/src/Language";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {PacketUtils} from "../../utils/PacketUtils";
import {EmoteUtils} from "../../utils/EmoteUtils";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {millisecondsToMinutes, minutesDisplay} from "../../../../Lib/src/utils/TimeUtils";
import {DisplayUtils} from "../../utils/DisplayUtils";

/**
 * Display the profile of a player
 */
async function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<CommandProfilePacketReq | null> {
	const askedPlayer = await PacketUtils.prepareAskedPlayer(interaction, keycloakUser);
	if (!askedPlayer) {
		return null;
	}
	return makePacket(CommandProfilePacketReq, {askedPlayer});
}

/**
 * Send a message with all the badges of the player in case there are too many
 * @param gameUsername
 * @param badges
 * @param interaction
 */
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

/**
 * Display the badges of the player as reactions
 * @param badges
 * @param msg
 */
async function displayBadges(badges: string[], msg: Message): Promise<void> {
	if (badges.length >= Constants.PROFILE.MAX_EMOTE_DISPLAY_NUMBER) {
		await msg.react(Constants.PROFILE.DISPLAY_ALL_BADGE_EMOTE);
		return;
	}
	for (const badgeId of badges) {
		await msg.react(badgeId);
	}
}

/**
 * Add a field to the profile embed
 * @param fields
 * @param fieldKey
 * @param shouldBeFielded
 * @param replacements
 */
function addField(fields: EmbedField[], fieldKey: string, shouldBeFielded: boolean, replacements: TranslationOption & {
	returnObjects?: false
}): void {
	if (shouldBeFielded) {
		fields.push({
			name: i18n.t(`commands:profile.${fieldKey}.fieldName`, replacements),
			value: i18n.t(`commands:profile.${fieldKey}.fieldValue`, replacements),
			inline: false
		});
	}
}

/**
 * Generate the fields of the profile embed
 * @param packet
 * @param lng
 */
function generateFields(packet: CommandProfilePacketRes, lng: Language): EmbedField[] {
	const fields: EmbedField[] = [];
	addField(fields, "information", true, {
		lng,
		health: packet.playerData.health.value,
		maxHealth: packet.playerData.health.max,
		money: packet.playerData.money,
		experience: packet.playerData.experience.value,
		experienceNeededToLevelUp: packet.playerData.experience.max
	});

	addField(fields, "statistics", Boolean(packet.playerData.stats), {
		lng,
		baseBreath: packet.playerData.stats?.breath.base,
		breathRegen: packet.playerData.stats?.breath.regen,
		cumulativeAttack: packet.playerData.stats?.attack,
		cumulativeDefense: packet.playerData.stats?.defense,
		cumulativeHealth: packet.playerData.stats?.energy.value,
		cumulativeSpeed: packet.playerData.stats?.speed,
		cumulativeMaxHealth: packet.playerData.stats?.energy.max,
		maxBreath: packet.playerData.stats?.breath.max
	});

	addField(fields, "mission", true, {
		lng,
		gems: packet.playerData.missions.gems,
		campaign: packet.playerData.missions.campaignProgression
	});

	addField(fields, packet.playerData.rank.unranked ? "unranked" : "ranking", true, {
		lng,
		score: packet.playerData.rank.score,
		rank: packet.playerData.rank.rank,
		numberOfPlayer: packet.playerData.rank.numberOfPlayers
	});

	addField(fields, packet.playerData.effect.healed ? "noTimeLeft" : "timeLeft", Boolean(packet.playerData.effect.hasTimeDisplay), {
		lng,
		effectId: packet.playerData.effect.effect,
		timeLeft: minutesDisplay(millisecondsToMinutes(packet.playerData.effect.timeLeft), lng)
	});

	addField(fields, "playerClass", Boolean(packet.playerData.classId), {
		lng,
		id: packet.playerData.classId
	});

	addField(fields, "fightRanking", Boolean(packet.playerData.fightRanking), {
		lng,
		leagueEmoji: packet.playerData.fightRanking ? DraftBotIcons.leagues[packet.playerData.fightRanking.league] : "",
		league: i18n.t(`models:leagues.${packet.playerData.fightRanking!.league}`, {lng}),
		gloryPoints: packet.playerData.fightRanking?.glory
	});

	addField(fields, "guild", Boolean(packet.playerData.guild), {
		lng,
		guild: packet.playerData.guild
	});

	addField(fields, "map", Boolean(packet.playerData.destinationId && packet.playerData.mapTypeId), {
		lng,
		mapTypeId: packet.playerData.mapTypeId,
		mapName: packet.playerData.destinationId,
		interpolation: {escapeValue: false}
	});

	addField(fields, "pet", Boolean(packet.playerData.pet), {
		lng,
		rarity: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.unitValues.petRarity).repeat(packet.playerData.pet?.rarity ?? 0),
		emote: packet.playerData.pet ? DisplayUtils.getPetIcon(packet.playerData.pet?.typeId, packet.playerData.pet?.sex) : "",
		name: packet.playerData.pet ? packet.playerData.pet?.nickname ?? DisplayUtils.getPetTypeName(lng, packet.playerData.pet?.typeId, packet.playerData.pet?.sex) : ""
	});

	return fields;
}

/**
 * Handle the response of the profile command
 * @param packet
 * @param context
 */
export async function handleCommandProfilePacketRes(packet: CommandProfilePacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (!interaction) {
		return;
	}
	const keycloakUser = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.keycloakId))!;
	const titleEffect = packet.playerData.effect.healed ? "healed" : packet.playerData.effect.effect;
	const reply = await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.setColor(<ColorResolvable>packet.playerData!.color)
				.setTitle(i18n.t("commands:profile.title", {
					lng: interaction.userLanguage,
					effectId: titleEffect,
					pseudo: keycloakUser.attributes.gameUsername,
					level: packet.playerData?.level
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
			await sendMessageAllBadgesTooMuchBadges(keycloakUser.attributes.gameUsername[0], packet.playerData!.badges!, interaction);
		}
		else {
			interaction.channel.send({content: i18n.t(`commands:profile.badges.${reaction.emoji.name}`, {lng: interaction.userLanguage})})
				.then((msg: Message | null) => {
					setTimeout(() => msg?.delete(), ProfileConstants.BADGE_DESCRIPTION_TIMEOUT);
				});
		}
	});
	if (packet.playerData?.badges.length !== 0) {
		await displayBadges(packet.playerData!.badges, reply);
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
	mainGuildCommand: false
};