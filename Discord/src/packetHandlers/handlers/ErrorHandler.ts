import {packetHandler} from "../PacketHandler";
import {WebSocket} from "ws";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {ErrorPacket} from "../../../../Lib/src/packets/commands/ErrorPacket";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";

export default class ErrorHandler {
	@packetHandler(ErrorPacket)

	pingRes(socket: WebSocket, packet: ErrorPacket, context: PacketContext): void {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const embed = new DraftBotEmbed()
			.setErrorColor()
			.setTitle(i18n.t("error:unexpectedError", { lng: interaction?.channel?.language }))
			.setDescription(packet.message);

		interaction?.replied ?
			interaction?.channel.send({ embeds: [embed]}) :
			interaction?.reply({ embeds: [embed] });
	}
}