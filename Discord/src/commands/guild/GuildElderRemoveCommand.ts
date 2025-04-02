import { ReactionCollectorCreationPacket } from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../../bot/DiscordCache";
import { KeycloakUtils } from "../../../../Lib/src/keycloak/KeycloakUtils";
import { keycloakConfig } from "../../bot/DraftBotShard";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import { DiscordCollectorUtils } from "../../utils/DiscordCollectorUtils";
import { ICommand } from "../ICommand";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import {
	CommandGuildElderRemoveAcceptPacketRes, CommandGuildElderRemovePacketReq,
	CommandGuildElderRemoveRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildElderRemovePacket";
import { ReactionCollectorGuildElderRemoveData } from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildElderRemove";
import { ReactionCollectorReturnType } from "../../packetHandlers/handlers/ReactionCollectorHandlers";

/**
 * Create a collector to confirm the demotion
 * @param packet
 * @param context
 */
export async function createGuildElderRemoveCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnType> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await interaction.deferReply();
	const data = packet.data.data as ReactionCollectorGuildElderRemoveData;
	const elderPlayer = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, data.demotedKeycloakId))!;
	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:guildElderRemove.title", {
		lng: interaction.userLanguage,
		pseudo: interaction.user.displayName
	}), interaction.user)
		.setDescription(
			i18n.t("commands:guildElderRemove.confirmDesc", {
				lng: interaction.userLanguage,
				elderPseudo: elderPlayer.attributes.gameUsername[0],
				guildName: data.guildName
			})
		);

	return await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

/**
 * Handle the response of the server after a guild elder remove,
 * this packet is only sent if the promotion is refused
 * @param packet
 * @param context
 */
export async function handleCommandGuildElderRemoveRefusePacketRes(packet: CommandGuildElderRemoveRefusePacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!originalInteraction) {
		return;
	}
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const promotedPlayer = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.demotedKeycloakId))!;
	await buttonInteraction?.editReply({
		embeds: [
			new DraftBotEmbed().formatAuthor(i18n.t("commands:guildElderRemove.canceledTitle", {
				lng: originalInteraction.userLanguage,
				pseudo: originalInteraction.user.displayName
			}), originalInteraction.user)
				.setDescription(
					i18n.t("commands:guildElderRemove.canceledDesc", {
						lng: originalInteraction.userLanguage,
						elderPseudo: promotedPlayer.attributes.gameUsername[0]
					})
				)
				.setErrorColor()
		]
	});
}

/**
 * Handle the response of the server after a guild elder remove,
 * this packet is only sent if the promotion is accepted
 * @param packet
 * @param context
 */
export async function handleCommandGuildElderRemoveAcceptPacketRes(packet: CommandGuildElderRemoveAcceptPacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const promotedPlayer = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.demotedKeycloakId!))!;
	if (buttonInteraction && originalInteraction) {
		await buttonInteraction.editReply({
			embeds: [
				new DraftBotEmbed().formatAuthor(i18n.t("commands:guildElderRemove.successElderRemoveTitle", {
					lng: originalInteraction.userLanguage,
					elderPseudo: promotedPlayer.attributes.gameUsername[0],
					guildName: packet.guildName
				}), originalInteraction.user)
					.setDescription(
						i18n.t("commands:guildElderRemove.acceptedDesc", { lng: originalInteraction.userLanguage })
					)
			]
		});
	}
}

/**
 * Demote an elder from a guild
 */
function getPacket(): CommandGuildElderRemovePacketReq {
	return makePacket(CommandGuildElderRemovePacketReq, {});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("guildElderRemove"),
	getPacket,
	mainGuildCommand: false
};
