import { loadConfig } from "./config/DiscordConfig";
import { ShardingManager } from "discord.js";
import { AutoPoster as autoPoster } from "topgg-autoposter";
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
			DraftBotLogger.info("Shard connected to Discord's Gateway");
			shard.send({
				type: "shardId",
				data: { shardId: shard.id }
			})
				.then();
		});
		shard.on("spawn", () => DraftBotLogger.info(`Shard ${shard.id} created`));
		shard.on("death", () => DraftBotLogger.error(`Shard ${shard.id} exited`));
		shard.on("disconnect", () => DraftBotLogger.error(`Shard ${shard.id} disconnected`));
		shard.on("reconnecting", () => DraftBotLogger.error(`Shard ${shard.id} reconnected`));
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
