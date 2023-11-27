import {loadConfig} from "./config/DiscordConfig";
import {ShardingManager} from "discord.js";

const shardCount = "auto";

/**
 * Function executed when the bot starts
 */
function main(): void {
	const config = loadConfig();

	const shardingManager = new ShardingManager("./dist/src/bot/DraftBotShard.js", {
		totalShards: shardCount,
		// Needed as in auto mode it has to make a request to know the needed number of shards
		token: config.DISCORD_CLIENT_TOKEN
	});

	shardingManager.on("shardCreate", shard => {
		shard.on("ready", () => {
			console.log(`[DEBUG/SHARD] Shard ${shard.id} connected to Discord's Gateway.`);
			shard.send({type: "shardId", data: {shardId: shard.id}}).then();
		});
		shard.on("spawn", () => console.error(`Shard ${shard.id} created`));
		shard.on("death", () => console.error(`Shard ${shard.id} exited`));
		shard.on("disconnect", () => console.error(`Shard ${shard.id} disconnected`));
		shard.on("reconnecting", () => console.error(`Shard ${shard.id} reconnected`));
		shard.on("error", (err) => console.error(`Shard ${shard.id} an error occurred ${err}`));
	});

	// TODO DBL post server count

	shardingManager.spawn({
		amount: shardCount
	}).catch(console.error);
}

main();