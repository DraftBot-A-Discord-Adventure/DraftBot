import {BigEvents} from "../../../../core/database/game/models/BigEvent";
import {CommandsManager} from "../../../CommandsManager";
import {Entities} from "../../../../core/database/game/models/Entity";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

const CT = require("../../../../core/CommandsTest");

/**
 * Force an report with a given event id
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const forceReportTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const entity = (await Entities.getOrRegister(interaction.user.id))[0];
	const eventId = parseInt(args[0], 10);
	const idMaxEvents = await BigEvents.getIdMaxEvents();
	if ((eventId > idMaxEvents || eventId <= 0) && args[0] !== "-1") {
		throw new Error("Erreur forcereport : id invalide ! Id d'event attendu -1 ou compris entre 1 et " + idMaxEvents);
	}
	await CT.getTestCommand("atravel").execute(language, interaction, ["5000"]);
	await CommandsManager.executeCommandWithParameters("report", interaction, language, entity, parseInt(args[0], 10));
	return format(commandInfo.messageWhenExecuted, {id: args[0] === "-1" ? "aléatoire" : args[0]});
};

export const commandInfo: ITestCommand = {
	name: "forcereport",
	aliases: ["fr", "forcer"],
	commandFormat: "<id>",
	typeWaited: {
		id: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Event {id} forcé !",
	description: "Force un rapport donné",
	execute: forceReportTestCommand,
	commandTestShouldReply: false
};