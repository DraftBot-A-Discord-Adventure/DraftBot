import {CommandPingPacketReq, CommandPingPacketRes} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {PacketListenerCallback} from "../../../../Lib/src/packets/PacketListener";

const command: PacketListenerCallback<CommandPingPacketReq> = (client, packet, response) => {
	const resPacket: CommandPingPacketRes = {
		latency: 0 // TODO
	};
	response.push(resPacket);
};

export default command;
