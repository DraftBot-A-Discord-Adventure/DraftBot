module.exports.help = {
	name: "friendlyfight",
	aliases: ["ff", "ffight"]
};

const FriendlyFightCommand = async function(language, message, args) {
	await fightCommand(language, message, args, true);
};

module.exports.execute = FriendlyFightCommand;
