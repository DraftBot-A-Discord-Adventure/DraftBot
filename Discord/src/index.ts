import { loadConfig } from "./config/DiscordConfig";
import { ShardingManager } from "discord.js";
import AutoPoster from "topgg-autoposter";
import { DraftBotLogger } from "../../Lib/src/logs/Logger";

const shardCount = "auto";

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

	shardingManager.on("shardCreate", shard => {
		shard.on("ready", () => {
			DraftBotLogger.get().info("Shard connected to Discord's Gateway");
			shard.send({
				type: "shardId", data: { shardId: shard.id }
			}).then();
		});
		shard.on("spawn", () => DraftBotLogger.get().info(`Shard ${shard.id} created`));
		shard.on("death", () => DraftBotLogger.get().error(`Shard ${shard.id} exited`));
		shard.on("disconnect", () => DraftBotLogger.get().error(`Shard ${shard.id} disconnected`));
		shard.on("reconnecting", () => DraftBotLogger.get().error(`Shard ${shard.id} reconnected`));
		shard.on("error", err => DraftBotLogger.get().error(`Shard ${shard.id} error`, { error: err }));
	});

	// Auto posting stats to top.gg
	if (config.DBL_TOKEN !== "" && config.DBL_TOKEN !== null) {
		// eslint-disable-next-line new-cap
		AutoPoster(config.DBL_TOKEN, shardingManager).on("posted", data => {
			DraftBotLogger.get().info(`Successfully posted following data to DBL: ${data}`);
		});
	}

	shardingManager.spawn({
		amount: shardCount
	}).catch(e => {
		DraftBotLogger.get().error("Error while spawning shards", { error: e });
	});
}

main();
