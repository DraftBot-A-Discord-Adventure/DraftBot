/**
 * Displays the ping of the bot and allow the player to check if the bot is online
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PingCommand = function(language, message) {
	message.channel.send(JsonReader.commands.ping.getTranslation(language).create)
		.then((msg) => {
			msg.edit(format(JsonReader.commands.ping.getTranslation(language).edit,
				{timeElasped: msg.createdTimestamp - message.createdTimestamp}));
		});
};

module.exports = {
	commands: [
		{
			name: "ping",
			func: PingCommand,
			aliases: ["mention"]
		}
	]
};

module.exports.execute = (message, language, args) => {

};

module.exports.help = {
	name : ""
};