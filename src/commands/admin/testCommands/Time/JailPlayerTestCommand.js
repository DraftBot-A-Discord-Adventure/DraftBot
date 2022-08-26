import {Entities} from "../../../../core/database/game/models/Entity";
import {Maps} from "../../../../core/Maps";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {Constants} from "../../../../core/Constants";
import {format} from "../../../../core/utils/StringFormatter";

/**
 * Jail the given player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const jailPlayerTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(getIdFromMention(args[0]));
	await Maps.applyEffect(entity.Player, Constants.EFFECT.LOCKED, 0, NumberChangeReason.TEST);
	await entity.Player.save();
	return format(module.exports.commandInfo.messageWhenExecuted, {player: args[0]});
};

module.exports.commandInfo = {
	name: "jailplayer",
	aliases: ["jail"],
	commandFormat: "<mention>",
	typeWaited: {
		mention: typeVariable.MENTION
	},
	messageWhenExecuted: "Vous avez enfermé {player} !",
	description: "Enferme le joueur donné",
	commandTestShouldReply: true,
	execute: jailPlayerTestCommand
};