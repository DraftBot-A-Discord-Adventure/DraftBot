import {packetHandler} from "../PacketHandler";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {ErrorPacket} from "../../../../Lib/src/packets/commands/ErrorPacket";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {BlockedPacket} from "../../../../Lib/src/packets/commands/BlockedPacket";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";

export default class ErrorHandler {
	@packetHandler(ErrorPacket)
	async errorHandler(packet: ErrorPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const embed = new DraftBotEmbed()
			.setErrorColor()
			.setTitle(i18n.t("error:unexpectedError", {lng: interaction?.channel?.language}))
			.setDescription(packet.message);

		await interaction?.channel.send({embeds: [embed]});
	}

	@packetHandler(BlockedPacket)
	async blockedHandler(packet: BlockedPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const otherPlayer = context.keycloakId !== packet.keycloakId;
		const originalUser = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const blockedUser = otherPlayer ? (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.keycloakId!))! : originalUser;

		let errorReasons = "";
		packet.reasons.forEach(reason => {
			errorReasons = errorReasons.concat(`${i18n.t(`error:blockedContext.${reason}`, { lng: interaction?.userLanguage })}, `);
		});
		errorReasons = errorReasons.slice(0, -2);

		const embed = new DraftBotEmbed()
			.setErrorColor()
			.setTitle(i18n.t("error:titleDidntWork", {lng: interaction?.channel?.language, pseudo: originalUser.attributes.gameUsername }))
			.setDescription(
				otherPlayer ?
					i18n.t("error:anotherPlayerBlocked", { lng: interaction?.userLanguage, username: blockedUser.attributes.gameUsername, reasons: errorReasons }) :
					i18n.t("error:playerBlocked", { lng: interaction?.userLanguage, reasons: errorReasons })
			);

		if (interaction?.deferred && !interaction.replyEdited) {
			interaction?.editReply({embeds: [embed]});
		}
		else if (!interaction?.deferred && !interaction?.replied) {
			interaction?.reply({embeds: [embed]});
		}
		else {
			interaction?.channel.send({embeds: [embed]});
		}
	}
}