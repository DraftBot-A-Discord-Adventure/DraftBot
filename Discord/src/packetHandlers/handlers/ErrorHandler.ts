import { packetHandler } from "../PacketHandler";
import { PacketContext } from "../../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {
	ErrorBannedPacket, ErrorMaintenancePacket, ErrorPacket
} from "../../../../Lib/src/packets/commands/ErrorPacket";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { BlockedPacket } from "../../../../Lib/src/packets/commands/BlockedPacket";
import { KeycloakUtils } from "../../../../Lib/src/keycloak/KeycloakUtils";
import { keycloakConfig } from "../../bot/DraftBotShard";
import { LANGUAGE } from "../../../../Lib/src/Language";
import { handleClassicError } from "../../utils/ErrorUtils";

export default class ErrorHandler {
	@packetHandler(ErrorPacket)
	async errorHandler(context: PacketContext, packet: ErrorPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const embed = new DraftBotEmbed()
			.setErrorColor()
			.setTitle(i18n.t("error:unexpectedError", { lng: interaction.userLanguage }))
			.setDescription(packet.message);

		await interaction.channel.send({ embeds: [embed] });
	}

	@packetHandler(BlockedPacket)
	async blockedHandler(context: PacketContext, packet: BlockedPacket): Promise<void> {
		const lng = DiscordCache.getInteraction(context.discord!.interaction)?.userLanguage ?? LANGUAGE.ENGLISH;
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const buttonInteraction = context.discord?.buttonInteraction ? DiscordCache.getButtonInteraction(context.discord.buttonInteraction) : undefined;
		const otherPlayer = context.keycloakId !== packet.keycloakId;
		const originalUser = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const blockedUser = otherPlayer ? (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.keycloakId!))! : originalUser;

		let errorReasons = "";
		packet.reasons.forEach(reason => {
			errorReasons = errorReasons.concat(`${i18n.t(`error:blockedContext.${reason}`, {
				lng,
				interpolation: { escapeValue: false }
			})}, `);
		});
		errorReasons = errorReasons.slice(0, -2);

		const embed = new DraftBotEmbed()
			.setErrorColor()
			.setTitle(i18n.t("error:titleDidntWork", {
				lng,
				pseudo: originalUser.attributes.gameUsername
			}))
			.setDescription(
				otherPlayer
					? i18n.t("error:anotherPlayerBlocked", {
						lng,
						username: blockedUser.attributes.gameUsername,
						reasons: errorReasons,
						interpolation: { escapeValue: false }
					})
					: i18n.t("error:playerBlocked", {
						lng,
						reasons: errorReasons,
						interpolation: { escapeValue: false }
					})
			);

		if (buttonInteraction) {
			if (buttonInteraction?.deferred) {
				await buttonInteraction?.editReply({ embeds: [embed] });
			}
			else if (!buttonInteraction?.deferred && !buttonInteraction?.replied) {
				await buttonInteraction?.reply({ embeds: [embed] });
			}
			else {
				await interaction?.channel.send({ embeds: [embed] });
			}
		}
		else if (interaction?.deferred && !interaction.replyEdited) {
			await interaction?.editReply({ embeds: [embed] });
		}
		else if (!interaction?.deferred && !interaction?.replied) {
			await interaction?.reply({ embeds: [embed] });
		}
		else {
			await interaction?.channel.send({ embeds: [embed] });
		}
	}

	@packetHandler(ErrorMaintenancePacket)
	async maintenanceHandler(context: PacketContext, _packet: ErrorMaintenancePacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);

		if (!interaction) {
			return;
		}
		const lng = interaction.userLanguage;
		const embed = new DraftBotEmbed()
			.setErrorColor()
			.formatAuthor(i18n.t("error:maintenanceTitle", { lng }), interaction.user)
			.setDescription(i18n.t("error:maintenance", { lng }));
		await interaction.channel.send({ embeds: [embed] });
	}

	@packetHandler(ErrorBannedPacket)
	async bannedHandler(context: PacketContext, _packet: ErrorBannedPacket): Promise<void> {
		await handleClassicError(context, "error:banned");
	}
}
