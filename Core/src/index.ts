import {DraftBot} from "./core/bot/DraftBot";
import {loadConfig} from "./core/bot/DraftBotConfig";
import {
	DraftBotPacket,
	makePacket
} from "../../Lib/src/packets/DraftBotPacket";
import {ErrorPacket} from "../../Lib/src/packets/commands/ErrorPacket";
import { connect } from "mqtt";
import {PacketUtils} from "./core/utils/PacketUtils";
import {MqttConstants} from "../../Lib/src/constants/MqttConstants";

export const botConfig = loadConfig();
export let draftBotInstance: DraftBot = null;

console.log("Running DraftBot 5.0.0");

export const mqttClient = connect(botConfig.MQTT_HOST);

mqttClient.on("connect", () => {
	mqttClient.subscribe(MqttConstants.CORE_TOPIC, (err) => {
		if (err) {
			console.error(err);
		}
		else {
			console.log("Connected to MQTT");
		}
	});
});

// Todo log commands
mqttClient.on("message", async (topic, message) => {
	const messageString = message.toString();
	console.log(`Received message from topic ${topic}: ${messageString}`);

	const dataJson = JSON.parse("" + message);
	if (!Object.hasOwn(dataJson, "packet") || !Object.hasOwn(dataJson, "context")) {
		draftBotInstance.logger.log(`Wrong packet format : ${messageString}`);
		return;
	}
	const response: DraftBotPacket[] = [];
	const listener = draftBotInstance.packetListener.getListener(dataJson.packet.name);
	if (!listener) {
		const errorMessage = `No listener found for packet '${dataJson.packet.name}'`;
		console.error(errorMessage);
		response.push(makePacket(ErrorPacket, { message: errorMessage }));
	}
	else {
		await draftBotInstance.packetListener.getListener(dataJson.packet.name)(dataJson.packet.data, dataJson.context, response);
	}

	PacketUtils.sendPackets(dataJson.context, response);
});

require("source-map-support").install();
draftBotInstance = new DraftBot(loadConfig());
draftBotInstance.init().then();