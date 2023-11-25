import {DraftBotPacket} from "../DraftBotPacket";

export interface CommandRarityPacketReq extends DraftBotPacket {
}

export interface CommandRarityPacketRes extends DraftBotPacket {
	common: number;
	uncommon: number;
	exotic: number;
	rare: number;
	special: number;
	epic: number;
	legendary: number;
	unique: number;
}