module.exports.help = {
	name: "topweek",
	aliases: ["tw", "topw"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

const TopWeekCommand = async (message, language, args) => {
	args.unshift("w");
	await getCommandFromAlias("t").execute(message, language, args);
};

module.exports.execute = TopWeekCommand;