import {Constants} from "../../../../core/Constants";
import {NumberChangeReason} from "../../../../core/constants/LogsConstants";
import {format} from "../../../../core/utils/StringFormatter";
import {ITestCommand} from "../../../../core/CommandsTest";
import {EffectsConstants} from "../../../../core/constants/EffectsConstants";
import {TravelTime} from "../../../../core/maps/TravelTime";
import {Players} from "../../../../core/database/game/models/Player";
import {DraftbotInteraction} from "../../../../core/messages/DraftbotInteraction";

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
		effect: Constants.TEST_VAR_TYPES.STRING
	},
	messageWhenExecuted: "Vous avez maintenant l'effet {effect} !",
	description: `Met l'effet donné à votre joueur\nListe des effets :\n${printableEffects}`,
	commandTestShouldReply: true,
	execute: null // Defined later
};

/**
 * Set the effect of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerEffectTestCommand = async (language: string, interaction: DraftbotInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const effectMalus = `:${args[0]}:`;
	if (Object.keys(EffectsConstants.DURATION).includes(effectMalus)) {
		await TravelTime.applyEffect(player, effectMalus, 0, new Date(), NumberChangeReason.TEST);
		await player.save();
		return format(commandInfo.messageWhenExecuted, {effect: effectMalus});
	}
	throw new Error("Effet inconnu ! (Il ne faut pas mettre les ::)");
};

commandInfo.execute = playerEffectTestCommand;