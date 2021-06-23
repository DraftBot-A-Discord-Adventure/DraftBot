module.exports.help = {
	name: "effect",
	commandFormat: "<effect>",
	typeWaited: {
		effect: typeVariable.STRING
	},
	messageWhenExecuted: "Vous avez maintenant l'effet {effect} !",
	description: "Mets l'effet donné à votre joueur"
};

const Maps = require("../../../../core/Maps");

/**
 * Set the effect of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
async function effect(language, message, args) {
	const [entity] = await Entities.getOrRegister(message.author.id);
	const effectMalus = ":" + args[0] + ":";
	if (JsonReader.models.players.effectMalus[effectMalus]) {
		await Maps.applyEffect(entity.Player, effectMalus);
		await entity.Player.save();
		return format(module.exports.help.messageWhenExecuted, {effect: effectMalus});
	}
	throw new Error("Effet inconnu ! (Il ne faut pas mettre les ::)");

}

module.exports.execute = effect;