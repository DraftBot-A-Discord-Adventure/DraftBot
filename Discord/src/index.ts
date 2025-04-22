import {
	DraftBotConfig, loadConfig
} from "./config/DiscordConfig";
import {
	Shard, ShardingManager
} from "discord.js";
import { AutoPoster as autoPoster } from "topgg-autoposter";
import { DraftBotLogger } from "../../Lib/src/logs/DraftBotLogger";
import { discordConfig } from "./bot/DraftBotShard";
import { connect } from "mqtt";
import { MqttConstants } from "../../Lib/src/constants/MqttConstants";
import { MqttTopicUtils } from "../../Lib/src/utils/MqttTopicUtils";
import { DiscordConstants } from "./DiscordConstants";

const shardCount = "auto";

// As shardingManager overrides old shards with the same IDs, we need to keep track of the spawned shards
let spawnedShards: Shard[] = [];

function startShardingManagerMqtt(config: DraftBotConfig, shardingManager: ShardingManager): void {
	const mqttClient = connect(discordConfig.MQTT_HOST, {
		connectTimeout: MqttConstants.CONNECTION_TIMEOUT
	});

	mqttClient.on("connect", () => {
		DraftBotLogger.info("Connected to MQTT");
		const topic = MqttTopicUtils.getDiscordShardManagerTopic(config.PREFIX);
		mqttClient.publish(topic, "");
		mqttClient.subscribe(topic);
	});

	mqttClient.on("message", async (_topic, message) => {
		const messageString = message.toString();
		if (messageString.startsWith(DiscordConstants.MQTT.SHARD_DUPLICATED_MSG)) {
			const messageParts = messageString.split(":");
			const shardId = parseInt(messageParts[1], 10);
			DraftBotLogger.info(`Shard ${shardId} is duplicated, killing all its instances`);

			// Kill all shards with the same ID
			spawnedShards.forEach(shard => {
				if (shard.id === shardId) {
					const pid = shard.process!.pid;
					DraftBotLogger.info(`Killing shard ${shardId} with PID ${pid}...`);
					try {
						shard.kill();
						DraftBotLogger.info(`Shard ${shardId} with PID ${pid} killed`);
					}
					catch (e) {
						DraftBotLogger.errorWithObj(`Error while killing shard ${shardId} with PID ${pid}. Kill the whole process to clean everything up.`, e);
						process.exit(1);
					}
				}
			});

			// Clean up spawned shards
			spawnedShards = spawnedShards.filter(shard => shard.id !== shardId);

			// Create a new shard with the same ID
			DraftBotLogger.info(`Creating a new shard ${shardId}...`);
			try {
				const newShard = shardingManager.createShard(shardId);
				await newShard.spawn();
				DraftBotLogger.info(`New shard ${shardId} created`);
			}
			catch (e) {
				DraftBotLogger.errorWithObj(`Error while creating shard ${shardId}. Kill the whole process to clean everything up.`, e);
				process.exit(1);
			}
		}
	});
}

/**
 * Function executed when the bot starts
 */
function main(): void {
	const config = loadConfig();
	DraftBotLogger.init(config.LOGGER_LEVEL, config.LOGGER_LOCATIONS, { app: "ShardManager" }, config.LOKI_HOST
		? {
			host: config.LOKI_HOST,
			username: config.LOKI_USERNAME,
			password: config.LOKI_PASSWORD
		}
		: undefined);

	const shardingManager = new ShardingManager("./dist/Discord/src/bot/DraftBotShard.js", {
		totalShards: shardCount,

		// Needed as in auto mode it has to make a request to know the needed number of shards
		token: config.DISCORD_CLIENT_TOKEN
	});

	startShardingManagerMqtt(config, shardingManager);

	shardingManager.on("shardCreate", shard => {
		shard.on("ready", () => DraftBotLogger.info("Shard connected to Discord's Gateway"));
		shard.on("spawn", () => {
			spawnedShards.push(shard);
			DraftBotLogger.info(`Shard ${shard.id} created`);
			shard.send({
				type: "shardId",
				data: {
					shardId: shard.id,
					shardCount: shardingManager.totalShards
				}
			})
				.then();
		});
		shard.on("death", () => DraftBotLogger.error(`Shard ${shard.id} exited`));
		shard.on("disconnect", () => {
			/*
			 * Recreate the shard because it often creates duplications
			 * This fix make the bot restart often. Let's keep it commented for now
			 */
			/*
			 * DraftBotLogger.info(`Shard ${shard.id} disconnected, killing it and creating a new one...`);
			 * shard.kill();
			 * const newShard = shardingManager.createShard(shard.id);
			 * await newShard.spawn();
			 */

			DraftBotLogger.error(`Shard ${shard.id} disconnected`);
		});
		shard.on("reconnecting", () => {
			/*
			 * Recreate the shard because it often creates duplications
			 * This fix make the bot restart often. Let's keep it commented for now
			 */
			/*
			 * DraftBotLogger.info(`Shard ${shard.id} reconnecting, killing it and creating a new one...`);
			 * shard.kill();
			 * const newShard = shardingManager.createShard(shard.id);
			 * await newShard.spawn();
			 */

			DraftBotLogger.error(`Shard ${shard.id} reconnecting`);
		});
		shard.on("error", err => DraftBotLogger.errorWithObj(`Shard ${shard.id} error`, err));
	});

	// Auto posting stats to top.gg
	if (config.DBL_TOKEN !== "" && config.DBL_TOKEN !== "") {
		autoPoster(config.DBL_TOKEN, shardingManager)
			.on("posted", data => {
				DraftBotLogger.info(`Successfully posted following data to DBL: ${data}`);
			});
	}

	shardingManager.spawn({
		amount: shardCount
	}).catch(e => {
		DraftBotLogger.errorWithObj("Error while spawning shards", e);
	});
}

main();
