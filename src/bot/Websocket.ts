import {discordConfig} from "./DraftBotShard";
import {PacketListenerClient} from "../../../Lib/src/packets/PacketListener";
import {WebSocket} from "ws";
import {registerAllPacketHandlers} from "../packetHandlers/PacketHandler";

export class DiscordWebSocket {

	static socket: WebSocket | null = null;

	static packetListener: PacketListenerClient = new PacketListenerClient();

	static async init(): Promise<void> {
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
		await registerAllPacketHandlers();
	}
}

