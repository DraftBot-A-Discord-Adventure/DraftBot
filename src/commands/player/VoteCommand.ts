import {CommandVotePacketReq} from "../../../../Lib/src/packets/commands/CommandVotePacket";
import {PacketListenerCallback} from "../../../../Lib/src/packets/PacketListener";

const command: PacketListenerCallback<CommandVotePacketReq> = (client, packet, response) => {

};

export default command;