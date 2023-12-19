import {ExecuteTestCommandLike, ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "possibleEvents",
	description: "Affiche les évents possibles"
};

/**
 * Display all possible events
 */
const possibleEventsTestCommand: ExecuteTestCommandLike = (player) => {
	const mapId = player.getDestinationId();

	// TODO: replace when the BigEventsController will be implemented
	// Const possibleEvents = BigEventsController.getEventsNotFiltered(mapId);
	const possibleEvents = [{id: 1, triggers: [{type: "test", value: mapId}]}];
	let str = "";
	for (const event of possibleEvents) {
		str += `Event n°**${event.id}**\nTriggers :\n`;
		for (const trigger of event.triggers) {
			str += `- ${JSON.stringify(trigger)} : **${true /* TODO: replace when the BigEventsTrigger file will be implemented*/ /* Await verifyTrigger(event, trigger, mapId, player) */}**\n`;
		}
		str += "\n";
	}

	return str;
};

commandInfo.execute = possibleEventsTestCommand;