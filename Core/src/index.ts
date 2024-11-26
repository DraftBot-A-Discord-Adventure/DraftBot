import {DraftBot} from "./core/bot/DraftBot";
import {loadConfig} from "./core/bot/DraftBotConfig";
import {
	DraftBotPacket,
	makePacket, PacketContext
} from "../../Lib/src/packets/DraftBotPacket";
import {ErrorMaintenancePacket, ErrorPacket} from "../../Lib/src/packets/commands/ErrorPacket";
import { connect } from "mqtt";
import {PacketUtils} from "./core/utils/PacketUtils";
import {MqttConstants} from "../../Lib/src/constants/MqttConstants";
import {RightGroup} from "../../Lib/src/enums/RightGroup";

export const botConfig = loadConfig();
export let draftBotInstance: DraftBot = null;

console.log("Running DraftBot 5.0.0");

export const mqttClient = connect(botConfig.MQTT_HOST, {
	connectTimeout: MqttConstants.CONNECTION_TIMEOUT
});

mqttClient.on("connect", () => {
	mqttClient.subscribe(MqttConstants.CORE_TOPIC, (err) => {
		if (err) {
			console.error(err);
			process.exit(1);
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

	if (botConfig.MODE_MAINTENANCE && !(dataJson.context as PacketContext).rightGroups.includes(RightGroup.MAINTENANCE)) {
		response.push(makePacket(ErrorMaintenancePacket, {}));
	}
	else {
		const listener = draftBotInstance.packetListener.getListener(dataJson.packet.name);
		if (!listener) {
			const errorMessage = `No listener found for packet '${dataJson.packet.name}'`;
			console.error(errorMessage);
			response.push(makePacket(ErrorPacket, { message: errorMessage }));
		}
		else {
			await draftBotInstance.packetListener.getListener(dataJson.packet.name)(dataJson.packet.data, dataJson.context, response);
		}
	}

	PacketUtils.sendPackets(dataJson.context, response);
});

mqttClient.on("error", (error) => {
	console.error(error);
});

require("source-map-support").install();
draftBotInstance = new DraftBot();
draftBotInstance.init().then();