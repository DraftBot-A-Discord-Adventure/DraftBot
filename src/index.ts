import {ShardingManager} from "discord.js";

process.on("unhandledRejection", function(err: Error) {
	console.log(err.stack);
	process.exit(1);
});

const main = function() {
	const shardingManager = new ShardingManager("./dist/src/core/bot/index.js", {
		totalShards: 3
	});
	shardingManager.on("shardCreate", shard => {
		shard.on("ready", () => {
			console.log(`[DEBUG/SHARD] Shard ${shard.id} connected to Discord's Gateway.`);
			shard.send({ type: "shardId", data: { shardId: shard.id }}).then();
		});
	});
	shardingManager.spawn({
		amount: 3
	}).then();
};

main();