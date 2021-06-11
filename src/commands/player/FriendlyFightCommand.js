module.exports.help = {
	name: "friendlyfight",
	aliases: ["ff", "ffight"]
};

const FriendlyFightCommand = async function(message, language, args) {
	await fightCommand(message, language, args, true);
};

module.exports.execute = FriendlyFightCommand;
