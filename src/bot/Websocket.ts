import {discordConfig, draftBotClient} from "./DraftBotShard";
import {PacketListenerClient} from "../../../Lib/src/packets/PacketListener";
import {CommandPingPacketRes} from "../../../Lib/src/packets/commands/CommandPingPacket";
import {TextChannel} from "discord.js";
import {WebSocket} from "ws";

export class DiscordWebSocket {

	static socket: WebSocket | null = null;

	static packetListener: PacketListenerClient = new PacketListenerClient();

	static init(): void {
		DiscordWebSocket.socket = new WebSocket(discordConfig.WEBSOCKET_URL);

		DiscordWebSocket.socket.on("error", (err) => {
			console.error(`WebSocket error: '${err.message}'`);
		});

		// Register events
		DiscordWebSocket.socket.on("message", async (data) => {
			console.log(`PR: ${data}`);
			const dataJson = JSON.parse(data.toString());
			if (!Object.hasOwn(dataJson, "packets") || !Object.hasOwn(dataJson, "context")) {
				console.log(`Wrong packet format : ${data}`);
				return;
			}
			for (const packet of dataJson.packets) {
				await DiscordWebSocket.packetListener.getListener(packet.name)(DiscordWebSocket.socket!, packet.data, dataJson.context);
			}
		});

		// Register packets
		// TODO do that better than that
		DiscordWebSocket.packetListener.addPacketListener<CommandPingPacketRes>(CommandPingPacketRes, (socket, packet, context) => {
			draftBotClient?.channels.fetch(context.discord!.channel).then((channel) => {
				(channel as TextChannel).send({ content: "Pong!\nLatency : " + packet.latency }).then();
			});
		});
	}
}

