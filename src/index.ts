import {DraftBot} from "./core/bot/DraftBot";
import {loadConfig} from "./core/bot/DraftBotConfig";
import {DraftBotPacket} from "../../Lib/src/packets/DraftBotPacket";
import {sendPacket} from "../../Lib/src/packets/PacketUtils";
import {WebsocketClient} from "../../Lib/src/instances/WebsocketClient";
import {Logger} from "../../Lib/src/instances/Logger";
import {WebSocketServer} from "ws";
import {CommandsTest} from "./core/CommandsTest";

export const botConfig = loadConfig();
export let draftBotInstance: DraftBot = null;

const webSocketServer = new WebSocketServer({ port: 7071 });

console.log("Running DraftBot 5.0.0");

webSocketServer.on("connection", async (socket): Promise<void> => {
	const client: WebsocketClient = {
		webSocket: socket,
		logger: Logger.getInstance("core")
	};
	client.logger.log("Client connected");

	if (botConfig.TEST_MODE) {
		client.logger.mode = "console";
		await CommandsTest.init();
	}

	client.webSocket.addEventListener("message", async (event): Promise<void> => {
		// TODO log commands
		client.logger.log(`PR: ${event.data}`);
		const dataJson = JSON.parse("" + event.data);
		if (!Object.hasOwn(dataJson, "packet") || !Object.hasOwn(dataJson, "context")) {
			client.logger.log(`Wrong packet format : ${event.data}`);
			return;
		}
		const response: DraftBotPacket[] = [];
		await draftBotInstance.packetListener.getListener(dataJson.packet.name)(client, dataJson.data, dataJson.context, response);
		client.logger.log(`RS: ${JSON.stringify(response)}`);
		sendPacket(client.webSocket, {
			context: dataJson.context,
			packets: response.map((responsePacket) => ({
				name: responsePacket.constructor.name,
				data: responsePacket
			}))
		});
	});

	client.webSocket.addEventListener("close", (event) => {
		console.log(`Socket ${event.target} disconnected due to '${event.reason}'`);
	});
});

draftBotInstance = new DraftBot(loadConfig());

// https://ably.com/blog/web-app-websockets-nodejs