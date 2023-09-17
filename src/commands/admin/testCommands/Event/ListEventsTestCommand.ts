import {Players} from "../../../../core/database/game/models/Player";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Maps} from "../../../../core/maps/Maps";
import {BigEventsController} from "../../../../core/events/BigEventsController";

export const commandInfo: ITestCommand = {
	name: "listevents",
	aliases: ["listevent", "le"],
	commandFormat: "",
	messageWhenExecuted: "La liste des évents pour chaque lieu a été envoyée !",
	description: "Liste tous les évènements disponibles pour chaque lieu",
	commandTestShouldReply: true,
	execute: null // Defined later
};

/**
 * List all available events for each map
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const listEventsTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	let str = "";
	// Let's display for every map all available events
	for (const map of await Maps.getMaps()) {
		const events = await BigEventsController.getAvailableEvents(map.id, player);
		let eventsString = "";
		for (const event of events) {
			eventsString += `${event.id}\n`;
		}
		str += `**${map.nameFr}**\n${eventsString}\n`;
		if (str.length > 1800) { // Just to avoid the 2000 char limit of discord
			await interaction.channel.send({
				content: str
			});
			str = "";
		}
	}
	await interaction.channel.send({
		content: str
	});
	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = listEventsTestCommand;