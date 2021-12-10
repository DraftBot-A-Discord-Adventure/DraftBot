const {DraftBot} = require("../../../../core/bot/DraftBot");
module.exports.commandInfo = {
	name: "dailytimeout",
	commandFormat: "",
	messageWhenExecuted: "Vous avez effectué un dailytimeout !",
	description: "Effectue un dailytimeout (action journalière qui actualise la potion du jour et retire des lovePoints des pets)"
};

/**
 * Do a dailytimeout
 * @return {String} - The successful message formatted
 */
const dailyTimeoutTestCommand = () => {
	DraftBot.dailyTimeout();

	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = dailyTimeoutTestCommand;