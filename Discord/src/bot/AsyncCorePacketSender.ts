import { AsyncPacketSender } from "../../../Lib/src/packets/AsyncPacketSender";
import {
	DraftBotPacket, PacketContext
} from "../../../Lib/src/packets/DraftBotPacket";
import { PacketUtils } from "../utils/PacketUtils";

export class AsyncCorePacketSender extends AsyncPacketSender {
	protected sendPacket(context: PacketContext, packet: DraftBotPacket): Promise<void> {
		PacketUtils.sendPacketToBackend(context, packet);
		return Promise.resolve();
	}
}
