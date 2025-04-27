import {
	connect, IClientOptions, MqttClient
} from "mqtt";
import { DraftBotLogger } from "../../../Lib/src/logs/DraftBotLogger";

export abstract class RestWsMqttClient {
	protected mqttClient: MqttClient;

	public constructor(host: string, options: IClientOptions) {
		this.mqttClient = connect(host, options);

		this.mqttClient.on("connect", () => {
			DraftBotLogger.info("Connected to MQTT broker");
			this.onConnect();
		});

		this.mqttClient.on("message", (_topic, message) => {
			try {
				const messageString = message.toString();
				if (messageString === "") {
					return;
				}

				this.onMessage(messageString);
			}
			catch (e) {
				DraftBotLogger.errorWithObj("Error while processing MQTT message", e);
			}
		});
	}

	protected subscribeTo(mqttClient: MqttClient, topic: string, cleanBefore: boolean): void {
		if (cleanBefore) {
			mqttClient.publish(topic, "", { retain: true }); // Clear the last message to avoid processing it twice
		}

		mqttClient.subscribe(topic, err => {
			if (err) {
				DraftBotLogger.errorWithObj(`Error while subscribing to topic ${topic}`, err);
				process.exit(1);
			}
			else {
				DraftBotLogger.info(`Subscribed to topic ${topic}`);
			}
		});
	}

	abstract onConnect(): void;

	abstract onMessage(message: string): void;
}
