import {DraftBotPacket} from "../DraftBotPacket";

export class CommandRarityPacketReq extends DraftBotPacket {
}

export class CommandRarityPacketRes extends DraftBotPacket {
	common!: number;

	uncommon!: number;

	exotic!: number;

	rare!: number;

	special!: number;

	epic!: number;

	legendary!: number;

	unique!: number;
}