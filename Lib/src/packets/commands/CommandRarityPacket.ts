import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandRarityPacketReq extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
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