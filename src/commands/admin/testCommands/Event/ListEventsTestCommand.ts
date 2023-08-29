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
 * Reset the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const destroyPlayerTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	// Let's display for every map all available events
	for (const map of await Maps.getMaps()) {
		const events = await BigEventsController.getAvailableEvents(map.id, player);
		let eventsString = "";
		for (const event of events) {
			eventsString += `${event.id}\n`;
		}
		interaction.channel.send({
			content: `**${map.nameFr}**\n${eventsString}`
		});
	}
	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = destroyPlayerTestCommand;