import {DraftBotPacket} from "../DraftBotPacket";

export class CommandPingPacketReq extends DraftBotPacket {
	time!: number;
}

export class CommandPingPacketRes extends DraftBotPacket {
	clientTime!: number;
}