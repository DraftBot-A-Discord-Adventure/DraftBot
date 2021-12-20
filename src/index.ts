import {ShardingManager} from "discord.js";
import {loadConfig} from "./core/bot/DraftBotConfig";

process.on("unhandledRejection", function(err: Error) {
	console.log(err.stack);
	// process.exit(1);
});

const shardCount = "auto";

const main = function() {
	const shardingManager = new ShardingManager("./dist/src/core/bot/index.js", {
		totalShards: shardCount,
		// Needed as in auto mode it has to make a request to know the needed number of shards
		token: loadConfig().DISCORD_CLIENT_TOKEN
	});
	shardingManager.on("shardCreate", shard => {
		shard.on("ready", () => {
			console.log(`[DEBUG/SHARD] Shard ${shard.id} connected to Discord's Gateway.`);
			shard.send({ type: "shardId", data: { shardId: shard.id }}).then();
		});
	});
	shardingManager.spawn({
		amount: shardCount
	}).then();
};

main();