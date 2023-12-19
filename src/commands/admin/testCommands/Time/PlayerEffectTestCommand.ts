import {NumberChangeReason} from "../../../../core/constants/LogsConstants";
import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";
import {EffectsConstants} from "../../../../core/constants/EffectsConstants";
import {TravelTime} from "../../../../core/maps/TravelTime";

const effects = Object.keys(EffectsConstants.ERROR_TEXT).filter(value => [":baby:", ":smiley:", ":skull:", ":clock2:"].indexOf(value) === -1);
let printableEffects = "";
effects.forEach(e => {
	printableEffects = printableEffects.concat(`- ${e.slice(1, -1)}\n`);
});

export const commandInfo: ITestCommand = {
	name: "playereffect",
	aliases: ["effect"],
	commandFormat: "<effect>",
	typeWaited: {
		effect: TypeKey.STRING
	},
	description: `Met l'effet donné à votre joueur\nListe des effets :\n${printableEffects}`
};

/**
 * Set the effect of the player
 */
const playerEffectTestCommand: ExecuteTestCommandLike = async (player, args) => {
	const effectMalus = `:${args[0]}:`;
	if (!Object.keys(EffectsConstants.DURATION)
		.includes(effectMalus)) {
		throw new Error("Effet inconnu ! (Il ne faut pas mettre les ::)");
	}
	await TravelTime.applyEffect(player, effectMalus, 0, new Date(), NumberChangeReason.TEST);
	await player.save();
	return `Vous avez maintenant l'effet ${effectMalus} !`;
};

commandInfo.execute = playerEffectTestCommand;