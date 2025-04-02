import { ICommand } from "../ICommand";
import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import { SlashCommandBuilder } from "@discordjs/builders";
import { DiscordCache } from "../../bot/DiscordCache";
import { KeycloakUser } from "../../../../Lib/src/keycloak/KeycloakUser";
import {
	CommandGuildKickAcceptPacketRes,
	CommandGuildKickPacketReq,
	CommandGuildKickPacketRes,
	CommandGuildKickRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildKickPacket";
import { ReactionCollectorCreationPacket } from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { DiscordCollectorUtils } from "../../utils/DiscordCollectorUtils";
import { ReactionCollectorGuildKickData } from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildKick";
import { PacketUtils } from "../../utils/PacketUtils";
import {
	sendErrorMessage, SendManner
} from "../../utils/ErrorUtils";
import { KeycloakUtils } from "../../../../Lib/src/keycloak/KeycloakUtils";
import { keycloakConfig } from "../../bot/DraftBotShard";
import { ReactionCollectorReturnType } from "../../packetHandlers/handlers/ReactionCollectorHandlers";

/**
 * Kick a player from a guild
 */
async function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): Promise<CommandGuildKickPacketReq | null> {
	const askedPlayer = await PacketUtils.prepareAskedPlayer(interaction, user);
	if (!askedPlayer) {
		return null;
	}
	return makePacket(CommandGuildKickPacketReq, { askedPlayer });
}

/**
 * Handle the response of the server after a guild kick,
 * this packet is only sent if the kick cannot be done for some reason
 * @param packet
 * @param context
 */
export async function handleCommandGuildKickPacketRes(packet: CommandGuildKickPacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	if (!interaction) {
		return;
	}
	if (!packet.foundPlayer) {
		await sendErrorMessage(
			interaction.user,
			interaction,
			i18n.t("commands:guildKick.noPlayer", { lng: interaction.userLanguage }),
			{ sendManner: SendManner.REPLY }
		);
		return;
	}
	if (!packet.sameGuild) {
		await sendErrorMessage(
			interaction.user,
			interaction,
			i18n.t("commands:guildKick.notSameGuild", { lng: interaction.userLanguage }),
			{ sendManner: SendManner.REPLY }
		);
		return;
	}
	if (packet.himself) {
		await sendErrorMessage(
			interaction.user,
			interaction,
			i18n.t("commands:guildKick.himself", { lng: interaction.userLanguage }),
			{ sendManner: SendManner.REPLY }
		);
	}
}

/**
 * Create a collector to confirm the guild kick
 * @param packet
 * @param context
 */
export async function createGuildKickCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnType> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await interaction.deferReply();
	const data = packet.data.data as ReactionCollectorGuildKickData;
	const kickedPlayer = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, data.kickedKeycloakId))!;
	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:guildKick.title", {
		lng: interaction.userLanguage,
		pseudo: interaction.user.displayName
	}), interaction.user)
		.setDescription(
			i18n.t("commands:guildKick.confirmDesc", {
				lng: interaction.userLanguage,
				kickedPseudo: kickedPlayer.attributes.gameUsername,
				guildName: data.guildName
			})
		);

	return await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

/**
 * Handle the response of the server after a guild kick,
 * this packet is only sent if the kick is refused
 * @param packet
 * @param context
 */
export async function handleCommandGuildKickRefusePacketRes(packet: CommandGuildKickRefusePacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!originalInteraction) {
		return;
	}
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const kickedPlayer = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.kickedKeycloakId))!;
	await buttonInteraction?.editReply({
		embeds: [
			new DraftBotEmbed().formatAuthor(i18n.t("commands:guildKick.canceledTitle", {
				lng: originalInteraction.userLanguage,
				pseudo: originalInteraction.user.displayName
			}), originalInteraction.user)
				.setDescription(
					i18n.t("commands:guildKick.canceledDesc", {
						lng: originalInteraction.userLanguage,
						kickedPseudo: kickedPlayer.attributes.gameUsername
					})
				)
				.setErrorColor()
		]
	});
}

/**
 * Handle the response of the server after a guild kick,
 * this packet is only sent if the kick is accepted
 * @param packet
 * @param context
 */
export async function handleCommandGuildKickAcceptPacketRes(packet: CommandGuildKickAcceptPacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const kickedPlayer = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.kickedKeycloakId!))!;
	if (buttonInteraction && originalInteraction) {
		await buttonInteraction.editReply({
			embeds: [
				new DraftBotEmbed().formatAuthor(i18n.t("commands:guildKick.title", {
					lng: originalInteraction.userLanguage,
					pseudo: originalInteraction.user.displayName
				}), originalInteraction.user)
					.setDescription(
						i18n.t("commands:guildKick.acceptedDesc", {
							lng: originalInteraction.userLanguage,
							kickedPseudo: kickedPlayer.attributes.gameUsername,
							guildName: packet.guildName
						})
					)
			]
		});
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("guildKick")
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateOption("guildKick", "user", option)
				.setRequired(false))
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateOption("guildKick", "rank", option)
				.setRequired(false)) as SlashCommandBuilder,
	getPacket,
	mainGuildCommand: false
};
