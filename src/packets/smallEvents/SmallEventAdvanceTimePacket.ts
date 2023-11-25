import {DraftBotPacket} from "../DraftBotPacket";

export interface SmallEventAdvanceTimePacket extends DraftBotPacket {
	time: number;
}