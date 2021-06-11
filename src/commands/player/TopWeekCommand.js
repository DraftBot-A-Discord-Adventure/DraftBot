module.exports.help = {
	name: "topweek",
	aliases: ["tw", "topw"]
};

const TopWeekCommand = async (message, language, args) => {
	args.unshift("w");
	await topCommand(message, language, args);
};

module.exports.execute = TopWeekCommand;