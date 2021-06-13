module.exports.infos = {
	name: "fakevote",
	commandFormat: "",
	messageWhenExecuted: "Vous avez faussement voté !",
	description: "Effectue un faux vote"
};

/**
 * Simulate a topgg vote
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @return {String} - The successful message formatted
 */
async function fakevote(language, message) {
	await require("../../../../core/DBL").userDBLVote(message.author.id);
	return module.exports.infos.messageWhenExecuted;
}

module.exports.execute = fakevote;