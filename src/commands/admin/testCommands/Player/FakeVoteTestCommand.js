module.exports.commandInfo = {
	name: "fakevote",
	commandFormat: "",
	messageWhenExecuted: "Vous avez faussement voté !",
	description: "Effectue un faux vote"
};

/**
 * Simulate a topgg vote
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const fakeVoteTestCommand = async (language, interaction) => {
	// TODO investiguer sur la raison du crash cf https://discord.com/channels/429765017332613120/440879632837902346/955025758412230667
	await require("../../../../core/DBL").userDBLVote(interaction.user.id);
	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = fakeVoteTestCommand;