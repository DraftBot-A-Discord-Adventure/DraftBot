import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import { ICommand } from "../ICommand";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import {
	CommandGuildLeaveAcceptPacketRes,
	CommandGuildLeavePacketReq
} from "../../../../Lib/src/packets/commands/CommandGuildLeavePacket";
import { ReactionCollectorCreationPacket } from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import { DiscordCache } from "../../bot/DiscordCache";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import { DiscordCollectorUtils } from "../../utils/DiscordCollectorUtils";
import { ReactionCollectorGuildLeaveData } from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildLeave";
import { KeycloakUtils } from "../../../../Lib/src/keycloak/KeycloakUtils";
import { keycloakConfig } from "../../bot/DraftBotShard";
import { ReactionCollectorReturnTypeOrNull } from "../../packetHandlers/handlers/ReactionCollectorHandlers";

/**
 * Create a collector to accept/refuse to leave the guild
 * @param packet
 * @param context
 */
export async function createGuildLeaveCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnTypeOrNull> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await interaction.deferReply();
	const data = packet.data.data as ReactionCollectorGuildLeaveData;
	const newChiefPseudo = data.newChiefKeycloakId ? (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, data.newChiefKeycloakId))!.attributes.gameUsername : "";
	const keyDesc = data.isGuildDestroyed ? "confirmChiefDesc" : data.newChiefKeycloakId ? "confirmChiefDescWithElder" : "confirmDesc";
	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:guildLeave.title", {
		lng: interaction.userLanguage,
		pseudo: interaction.user.displayName
	}), interaction.user)
		.setDescription(
			i18n.t(`commands:guildLeave.${keyDesc}`, {
				lng: interaction.userLanguage,
				newChiefPseudo,
				guildName: data.guildName
			})
		);

	return await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

/**
 * Handle the response when the player leave its guild
 * @param packet
 * @param context
 */
export async function handleCommandGuildLeaveAcceptPacketRes(packet: CommandGuildLeaveAcceptPacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const keyTitle = packet.newChiefKeycloakId ? "newChiefTitle" : "successTitle";
	const keyDesc = packet.isGuildDestroyed ? "destroySuccess" : "leavingSuccess";
	const newChiefPseudo = packet.newChiefKeycloakId ? (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.newChiefKeycloakId))!.attributes.gameUsername : "";
	if (buttonInteraction && originalInteraction) {
		await buttonInteraction.editReply({
			embeds: [
				new DraftBotEmbed().formatAuthor(i18n.t(`commands:guildLeave.${keyTitle}`, {
					lng: originalInteraction.userLanguage,
					pseudo: originalInteraction.user.displayName,
					newChiefPseudo,
					guildName: packet.guildName
				}), originalInteraction.user)
					.setDescription(
						i18n.t(`commands:guildLeave.${keyDesc}`, {
							lng: originalInteraction.userLanguage,
							guildName: packet.guildName
						})
					)
			]
		});
	}
}

/**
 * Handle the response when the player don't leave its guild
 * @param context
 */
export async function handleCommandGuildLeaveRefusePacketRes(context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!originalInteraction) {
		return;
	}
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	await buttonInteraction?.editReply({
		embeds: [
			new DraftBotEmbed().formatAuthor(i18n.t("commands:guildLeave.canceledTitle", {
				lng: originalInteraction.userLanguage,
				pseudo: originalInteraction.user.displayName
			}), originalInteraction.user)
				.setDescription(
					i18n.t("commands:guildLeave.canceledDesc", {
						lng: originalInteraction.userLanguage
					})
				)
				.setErrorColor()
		]
	});
}

/**
 * Allow the player to leave its guild
 */
function getPacket(): CommandGuildLeavePacketReq {
	return makePacket(CommandGuildLeavePacketReq, {});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("guildLeave"),
	getPacket,
	mainGuildCommand: false
};
