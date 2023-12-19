import {ExecuteTestCommandLike, ITestCommand} from "../../../../core/CommandsTest";
import {Maps} from "../../../../core/maps/Maps";

export const commandInfo: ITestCommand = {
	name: "listevents",
	aliases: ["listevent", "le"],
	commandFormat: "",
	description: "Liste tous les évènements disponibles pour chaque lieu",
};

/**
 * List all available events for each map
 */
const listEventsTestCommand: ExecuteTestCommandLike = (_player) => {
	let str = "";
	// Let's display for every map all available events
	for (const map of Maps.getMaps()) {
		// const events = await BigEventsController.getAvailableEvents(map.id, player);
		// TODO: replace when the BigEventsController will be implemented
		const events = [{id: "test"}];
		let eventsString = "";
		for (const event of events) {
			eventsString += `${event.id}\n`;
		}
		str += `**${map.id}**\n${eventsString}\n`; // `**${map.nameFr}**\n${eventsString}\n`; TODO: replace with the correct map name i18n
	}
	return `${str}\n\nLa liste des évents pour chaque lieu a été envoyée !`;
};

commandInfo.execute = listEventsTestCommand;