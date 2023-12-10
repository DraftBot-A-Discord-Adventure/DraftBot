import {CommandPingPacketReq, CommandPingPacketRes} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {PacketListenerCallbackServer} from "../../../../Lib/src/packets/PacketListener";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";

const command: PacketListenerCallbackServer<CommandPingPacketReq> = (client, packet, context, response) => {
	response.push(makePacket<CommandPingPacketRes>(CommandPingPacketRes, {
		latency: 0
	}));
};

export default command;
