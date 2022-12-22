import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {BigEventsController} from "../../../../core/events/BigEventsController";
import {verifyTrigger} from "../../../../core/events/BigEventTrigger";

export const commandInfo: ITestCommand = {
	name: "possibleEvents",
	commandFormat: "",
	description: "Affiche les évents possibles",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Force a report with a given event id
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const possibleEventsTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const mapId = await player.getDestinationId();

	const possibleEvents = BigEventsController.getEventsNotFiltered(mapId);

	let str = "";
	for (const event of possibleEvents) {
		str += `Event n°**${event.id}**\nTriggers :\n`;
		for (const trigger of event.triggers) {
			str += `- ${JSON.stringify(trigger)} : **${await verifyTrigger(event, trigger, mapId, player)}**\n`;
		}
		str += "\n";
	}

	return str;
};

commandInfo.execute = possibleEventsTestCommand;