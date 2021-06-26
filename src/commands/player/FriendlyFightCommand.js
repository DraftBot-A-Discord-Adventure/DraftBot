module.exports.help = {
	name: "friendlyfight",
	aliases: ["ff", "ffight"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

const FriendlyFightCommand = async function(message, language, args) {
	await getCommandFromAlias("f").execute(message, language, args, true);
};

module.exports.execute = FriendlyFightCommand;
