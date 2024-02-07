import {DraftBotPacket} from "../DraftBotPacket";

export class CommandUpdatePacketReq extends DraftBotPacket {
}

export class CommandUpdatePacketRes extends DraftBotPacket {
	coreVersion!: string;
}