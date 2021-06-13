module.exports.infos = {
	name: "givebadge",
	commandFormat: "<badge>",
	typeWaited: {
		badge: typeVariable.EMOJI
	},
	messageWhenExecuted: "Vous avez maintenant le badge {badge} !",
	description: "Donne un badge à votre joueur"
};

/**
 * Give a badge to your player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
async function giveBadge(language, message, args) {
	const [entity] = await Entities.getOrRegister(message.author.id);
	entity.Player.addBadge(args[0]);
	entity.Player.save();

	return format(module.exports.infos.messageWhenExecuted, {badge: args[0]});
}

module.exports.execute = giveBadge;