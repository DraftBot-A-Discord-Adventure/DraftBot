module.exports.help = {
	name: "topweek",
	aliases: ["tw", "topw"]
};

const TopWeekCommand = async (message, language, args) => {
	args.unshift("w");
	await topCommand(language, message, args);
};

module.exports.execute = TopWeekCommand;