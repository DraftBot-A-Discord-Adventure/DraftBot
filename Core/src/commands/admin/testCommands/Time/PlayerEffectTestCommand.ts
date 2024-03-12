import {NumberChangeReason} from "../../../../../../Lib/src/constants/LogsConstants";
import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";
import {TravelTime} from "../../../../core/maps/TravelTime";
import {Effect} from "../../../../../../Lib/src/enums/Effect";

const effects = Array.from(Effect.getAll()).filter(value => [Effect.NOT_STARTED, Effect.NO_EFFECT, Effect.DEAD, Effect.OCCUPIED].indexOf(value) === -1);
let printableEffects = "";
effects.forEach(e => {
	printableEffects = printableEffects.concat(`- ${e.id}\n`);
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
	const effect = Effect.getById(args[0]);
	if (!effect) {
		throw new Error("Effet inconnu !");
	}
	await TravelTime.applyEffect(player, effect, 0, new Date(), NumberChangeReason.TEST);
	await player.save();
	return `Vous avez maintenant l'effet ${effect.id} !`;
};

commandInfo.execute = playerEffectTestCommand;