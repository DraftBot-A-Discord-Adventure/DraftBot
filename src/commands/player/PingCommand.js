const {draftBotInstance, shardId} = require("../../core/bot");
module.exports.commandInfo = {
	name: "ping",
	aliases: ["mention"]
};

/**
 * Displays the ping of the bot and allow the player to check if the bot is online
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PingCommand = (message, language) => {
	message.channel.send({ content: JsonReader.commands.ping.getTranslation(language).create })
		.then((msg) => {
			msg.edit({
				content: format(JsonReader.commands.ping.getTranslation(language).edit,
					{
						latency: msg.createdTimestamp - message.createdTimestamp,
						apiLatency: draftBotInstance.client.ws.ping,
						shardId: shardId,
						totalShards: draftBotInstance.client.shard.count - 1
					})
			});
		});
};

module.exports.execute = PingCommand;