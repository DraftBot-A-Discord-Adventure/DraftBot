module.exports.commandInfo = {
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
const fakeVoteTestCommand = async (language, message) => {
	await require("../../../../core/DBL").userDBLVote(message.author.id);
	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = fakeVoteTestCommand;