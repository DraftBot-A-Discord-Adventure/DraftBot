import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";
import {SmallEventDataController} from "../../../../data/SmallEvent";

const smallEventsKeys = SmallEventDataController.instance.getKeys();

const strings = ["Force un type de mini event parmis ceux-ci :"];
smallEventsKeys
	.forEach(seName => {
		strings.push(`- ${seName}`);
	});

export const commandInfo: ITestCommand = {
	name: "smallEvent",
	commandFormat: "<seName>",
	typeWaited: {
		seName: TypeKey.STRING
	},
	description: strings.join("\n")
};

const smallEventsKeysLower = smallEventsKeys.map(seName => seName.toLowerCase());

/**
 * Force a small event with a given event name
 */
const smallEventTestCommand: ExecuteTestCommandLike = (_player, args) => {
	const keyPos = smallEventsKeysLower.indexOf(args[0].toLowerCase());
	if (!smallEventsKeys.includes(args[0].toLowerCase())) {
		throw new Error(`Erreur smallEvent : le mini-event ${args[0]} n'existe pas. Veuillez vous référer à la commande "test help smallEvent" pour plus d'informations`);
	}
	// TODO : replace with the new way of executing commands
	// Await CommandsManager.executeCommandWithParameters("report", interaction, language, player, null, smallEventsKeys[keyPos]);
	return `Mini event \`${smallEventsKeys[keyPos]}\` forcé !`;
};

commandInfo.execute = smallEventTestCommand;