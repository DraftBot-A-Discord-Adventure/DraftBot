import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";
import {SmallEventDataController} from "../../../../data/SmallEvent";
import ReportCommand from "../../../player/ReportCommand";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../../../Lib/src/packets/DraftBotPacket";
import {Client} from "../../../../../../Lib/src/instances/Client";
import {CommandReportPacketReq} from "../../../../../../Lib/src/packets/commands/CommandReportPacket";
import {WebsocketClient} from "../../../../../../Lib/src/instances/WebsocketClient";

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
const smallEventTestCommand: ExecuteTestCommandLike = async (player, args, response: DraftBotPacket[], context: PacketContext, client: WebsocketClient) => {
	const keyPos = smallEventsKeysLower.indexOf(args[0].toLowerCase());
	if (keyPos === -1) {
		throw new Error(`Erreur smallEvent : le mini-event ${args[0]} n'existe pas. Veuillez vous référer à la commande "test help smallEvent" pour plus d'informations`);
	}

	await ReportCommand.execute(client, makePacket(CommandReportPacketReq, {keycloakId: player.keycloakId}), context, response, null, args[0]);
	return `Mini event \`${smallEventsKeys[keyPos]}\` forcé !`;
};

commandInfo.execute = smallEventTestCommand;