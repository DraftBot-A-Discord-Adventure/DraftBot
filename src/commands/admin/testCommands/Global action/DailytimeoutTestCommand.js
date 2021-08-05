module.exports.commandInfo = {
	name: "dailytimeout",
	commandFormat: "",
	messageWhenExecuted: "Vous avez effectué un dailytimeout !",
	description: "Effectue un dailytimeout (action journalière qui actualise la potion du jour et retire des lovePoints des pets)"
};

const DB = require("../../../../core/DraftBot");

/**
 * Do a dailytimeout
 * @return {String} - The successful message formatted
 */
const dailyTimeoutTestCommand = () => {
	DB.dailyTimeout();

	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = dailyTimeoutTestCommand;