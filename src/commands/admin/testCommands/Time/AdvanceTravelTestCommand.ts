import {format} from "../../../../core/utils/StringFormatter";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {TravelTime} from "../../../../core/maps/TravelTime";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "advancetravel",
	aliases: ["atravel"],
	commandFormat: "<time>",
	typeWaited: {
		time: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez avancé votre voyage de {time} minutes !",
	description: "Avance votre voyage d'une durée en minutes donnée",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Quick travel your travel of a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const advanceTravelTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	await TravelTime.timeTravel(player, parseInt(args[0], 10), NumberChangeReason.TEST);
	await player.save();
	return format(commandInfo.messageWhenExecuted, {time: args[0]});
};

commandInfo.execute = advanceTravelTestCommand;