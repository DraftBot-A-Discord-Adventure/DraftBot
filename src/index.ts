import {WebSocketServer} from "ws";
import {DraftBot} from "./core/bot/DraftBot";
import {loadConfig} from "./core/bot/DraftBotConfig";
import {DraftBotPacket} from "@Lib/src/packets/DraftBotPacket";
import {sendPacket} from "@Lib/src/packets/PacketUtils";

export const botConfig = loadConfig();
export let draftBotInstance: DraftBot = null;

const ws = new WebSocketServer({port: 7071});

console.log("Running DraftBot 5.0.0");

ws.on("connection", (client: WebSocket): void => {
	console.log("Client connected");

	client.addEventListener("message", async (event): Promise<void> => {
		try {
			const dataJson = JSON.parse(event.data);
			console.log(dataJson);
			const response: DraftBotPacket[] = [];
			await draftBotInstance.packetListener.getListener(dataJson.packet)(client, dataJson.data, response);
			sendPacket(client, response);
		} catch (e) {
			console.log(e);
		}
		client.close();
	});
});

draftBotInstance = new DraftBot(loadConfig());

// https://ably.com/blog/web-app-websockets-nodejs