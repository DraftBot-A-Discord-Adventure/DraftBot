import {
	ExecuteTestCommandLike, ITestCommand, TypeKey
} from "../../../../core/CommandsTest";
import { SmallEventDataController } from "../../../../data/SmallEvent";
import ReportCommand from "../../../player/ReportCommand";

const smallEventsKeys = SmallEventDataController.instance.getKeys();

const strings = ["Force un type de mini event parmis ceux-ci :"];
smallEventsKeys
	.forEach(seName => {
		strings.push(`- ${seName}`);
	});

export const commandInfo: ITestCommand = {
	name: "smallEvent",
	aliases: ["se"],
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
const smallEventTestCommand: ExecuteTestCommandLike = async (player, args, response, context) => {
	const keyPos = smallEventsKeysLower.indexOf(args[0].toLowerCase());
	if (keyPos === -1) {
		throw new Error(`Erreur smallEvent : le mini-event ${args[0]} n'existe pas. Veuillez vous référer à la commande "test help smallEvent" pour plus d'informations`);
	}

	await ReportCommand.execute(response, player, {}, context, args[0]);
	return `Mini event \`${smallEventsKeys[keyPos]}\` forcé !`;
};

commandInfo.execute = smallEventTestCommand;
