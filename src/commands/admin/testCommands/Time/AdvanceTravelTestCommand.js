import {Entities} from "../../../../core/database/game/models/Entity";
import {Maps} from "../../../../core/Maps";
import {format} from "../../../../core/utils/StringFormatter";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";

module.exports.commandInfo = {
	name: "advancetravel",
	aliases: ["atravel"],
	commandFormat: "<time>",
	typeWaited: {
		time: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez avancé votre voyage de {time} minutes !",
	description: "Avance votre voyage d'une durée en minutes donnée",
	commandTestShouldReply: true
};

/**
 * Quick travel your travel of a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const advanceTravelTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	await Maps.advanceTime(entity.Player, parseInt(args[0]), NumberChangeReason.TEST);
	await entity.Player.save();
	return format(module.exports.commandInfo.messageWhenExecuted, {time: args[0]});
};

module.exports.execute = advanceTravelTestCommand;