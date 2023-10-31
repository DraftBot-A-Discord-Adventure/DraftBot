import {WebSocketServer} from "ws";
import {DraftBot} from "./core/bot/DraftBot";
import {loadConfig} from "./core/bot/DraftBotConfig";
import {DraftBotPacket} from "../../Lib/src/packets/DraftBotPacket";
import {sendPacket} from "../../Lib/src/packets/PacketUtils";
import {WebsocketClient} from "../../Lib/src/instances/WebsocketClient";
import {Logger} from "../../Lib/src/instances/Logger";

export const botConfig = loadConfig();
export let draftBotInstance: DraftBot = null;

const ws = new WebSocketServer({port: 7071});

console.log("Running DraftBot 5.0.0");

ws.on("connection", (webSocket: WebSocket): void => {
	const client: WebsocketClient = {
		webSocket: webSocket,
		logger: Logger.getInstance("core")
	};
	client.logger.log("Client connected");

	if (botConfig.TEST_MODE) {
		client.logger.mode = "console";
	}

	client.webSocket.addEventListener("message", async (event): Promise<void> => {
		client.logger.log(`PR: ${event.data}`);
		const dataJson = JSON.parse(event.data);
		if (!Object.hasOwn(dataJson, "packet")) {
			client.logger.log(`Wrong packet format : ${event.data}`);
			return;
		}
		const response: DraftBotPacket[] = [];
		await draftBotInstance.packetListener.getListener((dataJson as {
			packet: string
		}).packet)(client, dataJson.data, response);
		client.logger.log(`RS: ${JSON.stringify(response)}`);
		sendPacket(client.webSocket, response);
		client.webSocket.close();
	});
});

draftBotInstance = new DraftBot(loadConfig());

// https://ably.com/blog/web-app-websockets-nodejs