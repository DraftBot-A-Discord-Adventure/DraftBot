import {Entities} from "../../../../core/models/Entity";
import {Maps} from "../../../../core/Maps";
import {Constants} from "../../../../core/Constants";

const effects = Object.keys(Constants.EFFECT.ERROR_TEXT).filter(function(value) {
	return [":baby:", ":smiley:", ":skull:", ":clock2:"].indexOf(value) === -1;
});
let printableEffects = "";
effects.forEach(e => {
	printableEffects = printableEffects.concat(`- ${e.slice(1, -1)}\n`);
});

module.exports.commandInfo = {
	name: "playereffect",
	aliases: ["effect"],
	commandFormat: "<effect>",
	typeWaited: {
		effect: typeVariable.STRING
	},
	messageWhenExecuted: "Vous avez maintenant l'effet {effect} !",
	description: `Mets l'effet donné à votre joueur\nListe des effets :\n${printableEffects}`,
	commandTestShouldReply: true
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