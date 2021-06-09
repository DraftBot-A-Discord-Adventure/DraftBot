module.exports.help = {
	"name": "topweek"
};

const TopWeekCommand = async (message, language, args) => {
	args.unshift("w");
	await topCommand(language, message, args);
};

module.exports.execute = TopWeekCommand;