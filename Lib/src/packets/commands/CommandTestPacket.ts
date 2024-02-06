import {DraftBotPacket} from "../DraftBotPacket";

export class CommandTestPacketReq extends DraftBotPacket {
	command?: string;
}

export class CommandTestPacketRes extends DraftBotPacket {
	result!: string;
	isError!: boolean;
}