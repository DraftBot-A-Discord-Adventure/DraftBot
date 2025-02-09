import {DraftbotCachedMessage} from "./DraftbotCachedMessage";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {CommandFightStatusPacket} from "../../../Lib/src/packets/commands/CommandFightPacket";

export class DraftbotFightStatusCachedMessage extends DraftbotCachedMessage {
	updateMessage = async (packet: CommandFightStatusPacket, context: PacketContext): Promise<void> => {
		// Do something with the cached message
	};

	duration = 30;
}
