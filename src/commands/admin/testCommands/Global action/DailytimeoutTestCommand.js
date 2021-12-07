const {draftBotInstance} = require("../../../../core/bot");
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
	draftBotInstance.dailyTimeout();

	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = dailyTimeoutTestCommand;