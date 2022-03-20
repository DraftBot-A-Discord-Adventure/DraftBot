import {Entities} from "../../../../core/models/Entity";
import {Maps} from "../../../../core/Maps";

module.exports.commandInfo = {
	name: "playereffect",
	aliases: ["effect"],
	commandFormat: "<effect>",
	typeWaited: {
		effect: typeVariable.STRING
	},
	messageWhenExecuted: "Vous avez maintenant l'effet {effect} !",
	description: "Mets l'effet donné à votre joueur"
};

/**
 * Set the effect of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerEffectTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const effectMalus = ":" + args[0] + ":";
	if (JsonReader.models.players.effectMalus[effectMalus]) {
		await Maps.applyEffect(entity.Player, effectMalus);
		await entity.Player.save();
		return format(module.exports.commandInfo.messageWhenExecuted, {effect: effectMalus});
	}
	throw new Error("Effet inconnu ! (Il ne faut pas mettre les ::)");

};

module.exports.execute = playerEffectTestCommand;