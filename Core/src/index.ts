import { DraftBot } from "./core/bot/DraftBot";
import { loadConfig } from "./core/bot/DraftBotConfig";
import {
	DraftBotPacket, makePacket, PacketContext
} from "../../Lib/src/packets/DraftBotPacket";
import {
	ErrorMaintenancePacket, ErrorPacket
} from "../../Lib/src/packets/commands/ErrorPacket";
import { connect } from "mqtt";
import { PacketUtils } from "./core/utils/PacketUtils";
import { MqttConstants } from "../../Lib/src/constants/MqttConstants";
import { RightGroup } from "../../Lib/src/types/RightGroup";
import { MqttTopicUtils } from "../../Lib/src/utils/MqttTopicUtils";
import { DraftBotCoreMetrics } from "./core/bot/DraftBotCoreMetrics";
import { millisecondsToSeconds } from "../../Lib/src/utils/TimeUtils";
import { DraftBotLogger } from "../../Lib/src/logs/DraftBotLogger";
import "source-map-support/register";

export const botConfig = loadConfig();
DraftBotLogger.init(botConfig.LOG_LEVEL, botConfig.LOG_LOCATIONS, { app: "Core" }, botConfig.LOKI_HOST
	? {
		host: botConfig.LOKI_HOST,
		username: botConfig.LOKI_USERNAME,
		password: botConfig.LOKI_PASSWORD
	}
	: undefined);
export let draftBotInstance: DraftBot = null;

DraftBotLogger.info("DraftBot Core 5.0.0");

export const mqttClient = connect(botConfig.MQTT_HOST, {
	connectTimeout: MqttConstants.CONNECTION_TIMEOUT
});

mqttClient.on("connect", () => {
	mqttClient.subscribe(MqttTopicUtils.getCoreTopic(botConfig.PREFIX), err => {
		if (err) {
			DraftBotLogger.errorWithObj("Error while subscribing to MQTT topic", err);
			process.exit(1);
		}
		else {
			DraftBotLogger.info("Connected to MQTT");
		}
	});
});

mqttClient.on("message", async (topic, message) => {
	const messageString = message.toString();
	const dataJson = JSON.parse(messageString);
	DraftBotLogger.debug(`Received message from topic ${topic}`, { packet: dataJson });
	if (!Object.hasOwn(dataJson, "packet") || !Object.hasOwn(dataJson, "context")) {
		DraftBotLogger.error("Wrong packet format", { packet: messageString });
		return;
	}
	const response: DraftBotPacket[] = [];
	const context: PacketContext = dataJson.context;

	if (
		botConfig.MODE_MAINTENANCE
		&& !(dataJson.context as PacketContext).rightGroups.includes(RightGroup.MAINTENANCE)
		&& !(dataJson.context as PacketContext).rightGroups.includes(RightGroup.ADMIN)
	) {
		response.push(makePacket(ErrorMaintenancePacket, {}));
	}
	else {
		const listener = draftBotInstance.packetListener.getListener(dataJson.packet.name);
		if (!listener) {
			const errorMessage = `No listener found for packet '${dataJson.packet.name}'`;
			DraftBotLogger.error(errorMessage);
			response.push(makePacket(ErrorPacket, { message: errorMessage }));
		}
		else {
			draftBotInstance.logsDatabase.logCommandUsage(context.keycloakId, context.frontEndOrigin, context.frontEndSubOrigin, dataJson.packet.name)
				.then();
			DraftBotCoreMetrics.incrementPacketCount(dataJson.packet.name);
			const startTime = Date.now();
			try {
				await listener(response, context, dataJson.packet.data);
			}
			catch (error) {
				DraftBotLogger.errorWithObj(`Error while processing packet '${dataJson.packet.name}'`, error);
				response.push(makePacket(ErrorPacket, { message: error.message }));
				DraftBotCoreMetrics.incrementPacketErrorCount(dataJson.packet.name);
			}
			DraftBotCoreMetrics.observePacketTime(dataJson.packet.name, millisecondsToSeconds(Date.now() - startTime));
		}
	}

	PacketUtils.sendPackets(context, response);
});

mqttClient.on("error", error => {
	DraftBotLogger.errorWithObj("MQTT error", error);
});

draftBotInstance = new DraftBot();
draftBotInstance.init()
	.then();
