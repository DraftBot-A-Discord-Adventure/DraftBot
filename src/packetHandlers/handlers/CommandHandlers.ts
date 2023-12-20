import {draftBotClient} from "../../bot/DraftBotShard";
import {TextChannel} from "discord.js";
import {packetHandler} from "../PacketHandler";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandPingPacketRes} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {WebSocket} from "ws";

export default class CommandHandlers {
	@packetHandler(CommandPingPacketRes)

	pingRes(socket: WebSocket, packet: CommandPingPacketRes, context: PacketContext): void {
		draftBotClient?.channels.fetch(context.discord!.channel)
			.then((channel) => {
				(channel as TextChannel).send({content: "Pong!\nLatency : " + packet.latency})
					.then();
			});
	}
}