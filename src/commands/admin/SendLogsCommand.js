module.exports.help = {
	name: "sendlogs",
	aliases: [],
	userPermissions: ROLES.USER.CONTRIBUTORS
};

/**
 * Allow a contributor to get the console logs
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const SendLogsCommand = async (message, language, args) => {
	if (message.channel.id !== JsonReader.app.CONTRIBUTORS_CHANNEL && message.author.id !== JsonReader.app.BOT_OWNER_ID) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.error.getTranslation(language).notContributorsChannel);
	}

	const fs = require("fs");

	if (args.length === 0) {
		await message.author.send({
			files: [{
				attachment: global.currLogsFile,
				name: global.currLogsFile.split("/")[1]
			}]
		});
	}
	else if (args[0] === "list") {
		fs.readdir("logs", function(err, files) {
			if (err) {
				return message.author.send("```Unable to scan directory: " + err + "```");
			}

			let msg = "```";
			files.forEach(function(file) {
				msg += file + " (" + fs.statSync("logs/" + file).size / 1000.0 + " ko)" + "\n";
				if (msg > 1800) {
					message.author.send(msg + "```");
					msg = "```";
				}
			});
			if (msg !== "```") {
				message.author.send(msg + "```");
			}
		});
	}
	else {
		if (args[0].includes("/") || args[0].includes("..")) {
			return await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.sendLogs.getTranslation(language).localFileInclusion);
		}
		if (!args[0].endsWith(".txt")) {
			args[0] += ".txt";
		}
		if (fs.existsSync("logs/" + args[0])) {
			await message.author.send({
				files: [{
					attachment: "logs/" + args[0],
					name: args[0]
				}]
			});
		}
		else {
			await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.sendLogs.getTranslation(language).noLogFile);
		}
	}
};

module.exports.execute = SendLogsCommand;