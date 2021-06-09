/**
 * Allows an admin to check the server list
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ServersCommand = async (language, message) => {
	if (await canPerformCommand(message, language,
		PERMISSION.ROLE.BOT_OWNER) !== true) {
		return;
	}

	let count = 0;
	let total = 0;
	let result = "";

	function logMapElements(guild) {
		count++;
		const {validation, humans, bots, ratio} = getValidationInfos(guild);
		total += humans;
		result += format(JsonReader.bot.getTranslation(language).serverList, {
			count: count,
			guild: guild,
			humans: humans,
			robots: bots,
			ratio: ratio,
			validation: validation
		}) + "\n";
		if (result.length > 1800) {
			message.channel.send(result);
			result = "";
		}
	}

	client.guilds.cache.forEach(logMapElements);
	result += "\n" + format(JsonReader.bot.getTranslation(language).totalUsersCount, {count: total});
	message.channel.send(result);
};

module.exports = {
	commands: [
		{
			name: "servs",
			func: ServersCommand
		}
	]
};