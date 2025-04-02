import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandPingPacketReq extends DraftBotPacket {
	time!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPingPacketRes extends DraftBotPacket {
	clientTime!: number;
}
