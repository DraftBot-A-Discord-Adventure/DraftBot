import { DraftBot } from "./core/bot/DraftBot";
import { loadConfig } from "./core/bot/DraftBotConfig";
import {
	DraftBotPacket, makePacket, PacketContext, PacketLike
} from "../../Lib/src/packets/DraftBotPacket";
import {
	ErrorMaintenancePacket, ErrorPacket, ErrorResetIsNow, ErrorSeasonEndIsNow
} from "../../Lib/src/packets/commands/ErrorPacket";
import { connect } from "mqtt";
import { PacketUtils } from "./core/utils/PacketUtils";
import { MqttConstants } from "../../Lib/src/constants/MqttConstants";
import { RightGroup } from "../../Lib/src/types/RightGroup";
import { MqttTopicUtils } from "../../Lib/src/utils/MqttTopicUtils";
import { DraftBotCoreMetrics } from "./core/bot/DraftBotCoreMetrics";
import {
	millisecondsToSeconds, resetIsNow, seasonEndIsNow
} from "../../Lib/src/utils/TimeUtils";
import { DraftBotLogger } from "../../Lib/src/logs/DraftBotLogger";
import "source-map-support/register";
import { CoreConstants } from "./core/CoreConstants";

process.on("uncaughtException", error => {
	console.error(`Uncaught exception: ${error}`);
	if (DraftBotLogger.isInitialized()) {
		DraftBotLogger.errorWithObj("Uncaught exception", error);
	}
});

process.on("unhandledRejection", error => {
	console.error(`Unhandled rejection: ${error}`);
	if (DraftBotLogger.isInitialized()) {
		DraftBotLogger.errorWithObj("Unhandled rejection", error);
	}
});

export const botConfig = loadConfig();
DraftBotLogger.init(botConfig.LOG_LEVEL, botConfig.LOG_LOCATIONS, { app: "Core" }, botConfig.LOKI_HOST
	? {
		host: botConfig.LOKI_HOST,
		username: botConfig.LOKI_USERNAME,
		password: botConfig.LOKI_PASSWORD
	}
	: undefined);
export let draftBotInstance: DraftBot = null;

DraftBotLogger.info(`${CoreConstants.OPENING_LINE} - ${process.env.npm_package_version}`);

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

function globalStopOfPlayers(response: DraftBotPacket[], dataJson: {
	context: PacketContext; packet: PacketLike<unknown>;
}): boolean {
	if (
		botConfig.MODE_MAINTENANCE
		&& !CoreConstants.BYPASS_MAINTENANCE_PACKETS.includes(dataJson.packet.name)
		&& !(dataJson.context as PacketContext).rightGroups?.includes(RightGroup.MAINTENANCE)
		&& !(dataJson.context as PacketContext).rightGroups?.includes(RightGroup.ADMIN)
	) {
		response.push(makePacket(ErrorMaintenancePacket, {}));
		return true;
	}
	if (resetIsNow()) {
		response.push(makePacket(ErrorResetIsNow, {}));
		return true;
	}
	if (seasonEndIsNow()) {
		response.push(makePacket(ErrorSeasonEndIsNow, {}));
		return true;
	}
	return false;
}

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


	if (!globalStopOfPlayers(response, dataJson)) {
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
