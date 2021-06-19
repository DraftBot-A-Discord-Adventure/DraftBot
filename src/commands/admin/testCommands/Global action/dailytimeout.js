module.exports.infos = {
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
function dailytimeout() {
	DB.dailyTimeout();

	return module.exports.infos.messageWhenExecuted;
}

module.exports.execute = dailytimeout;