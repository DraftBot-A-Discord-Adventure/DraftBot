"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var discord_js_1 = require("discord.js");
var DraftBotConfig_1 = require("./core/bot/DraftBotConfig");
var IPCServer_1 = require("./core/bot/ipc/IPCServer");
var topgg_autoposter_1 = require("topgg-autoposter");
var DraftBotWebServer_1 = require("./core/bot/DraftBotWebServer");
process.on("unhandledRejection", function (err) {
    console.log(err);
    console.log(err.stack);
    // process.exit(1);
});
var shardCount = "auto";
/**
 * Function executed when the bot starts : Creates the shards and starts the IPC server
 */
function main() {
    var ipcServer = new IPCServer_1.IPCServer();
    var config = (0, DraftBotConfig_1.loadConfig)();
    if (config.WEBSERVER_PORT && config.WEBSERVER_PORT !== 0) {
        (0, DraftBotWebServer_1.initWebServer)(config.WEBSERVER_PORT, ipcServer);
    }
    var shardingManager = new discord_js_1.ShardingManager("./dist/src/core/bot/index.js", {
        totalShards: shardCount,
        // Needed as in auto mode it has to make a request to know the needed number of shards
        token: config.DISCORD_CLIENT_TOKEN
    });
    shardingManager.on("shardCreate", function (shard) {
        shard.on("ready", function () {
            console.log("[DEBUG/SHARD] Shard ".concat(shard.id, " connected to Discord's Gateway."));
            shard.send({ type: "shardId", data: { shardId: shard.id } }).then();
        });
    });
    // Auto posting stats to top.gg
    if (config.DBL_TOKEN !== "" && config.DBL_TOKEN !== null) {
        // eslint-disable-next-line new-cap
        (0, topgg_autoposter_1.default)(config.DBL_TOKEN, shardingManager).on("posted", function (data) {
            console.log("Successfully posted following data to DBL: ".concat(data));
        });
    }
    shardingManager.spawn({
        amount: shardCount
    }).then();
}
main();
