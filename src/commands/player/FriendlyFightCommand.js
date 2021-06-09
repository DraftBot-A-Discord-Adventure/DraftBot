module.exports.help = {
	"name" : "friendlyfight"
};

const FriendlyFightCommand = async function(language, message, args) {
	await fightCommand(language, message, args, true);
};

module.exports.execute = FriendlyFightCommand;