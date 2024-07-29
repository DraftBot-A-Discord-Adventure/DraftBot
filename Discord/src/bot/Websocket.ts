import {discordConfig} from "./DraftBotShard";
import {PacketListenerClient} from "../../../Lib/src/packets/PacketListener";
import {WebSocket} from "ws";
import {registerAllPacketHandlers} from "../packetHandlers/PacketHandler";
import {makePacket, PacketDirection, verifyPacketsImplementation} from "../../../Lib/src/packets/DraftBotPacket";
import {ErrorPacket} from "../../../Lib/src/packets/commands/ErrorPacket";

export class DiscordWebSocket {

	static socket: WebSocket | null = null;

	static packetListener: PacketListenerClient = new PacketListenerClient();

	static async init(): Promise<void> {
		// Register packets
		await registerAllPacketHandlers();
		verifyPacketsImplementation(DiscordWebSocket.packetListener.getImplementedPackets(), PacketDirection.BACK_TO_FRONT);

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
				let listener = DiscordWebSocket.packetListener.getListener(packet.name);
				if (!listener) {
					packet.packet = makePacket(ErrorPacket, { message: `No packet listener found for received packet '${packet.name}'.\n\nData:\n${JSON.stringify(packet.packet)}` });
					listener = DiscordWebSocket.packetListener.getListener("ErrorPacket")!;
				}
				await listener(DiscordWebSocket.socket!, packet.packet, dataJson.context);
			}
		});
	}
}

