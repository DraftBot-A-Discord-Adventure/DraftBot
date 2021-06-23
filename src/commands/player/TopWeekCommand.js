module.exports.help = {
	name: "topweek",
	aliases: ["tw", "topw"]
};

const TopWeekCommand = async (message, language, args) => {
	args.unshift("w");
	await getCommandFromAlias("t").execute(message, language, args);
};

module.exports.execute = TopWeekCommand;