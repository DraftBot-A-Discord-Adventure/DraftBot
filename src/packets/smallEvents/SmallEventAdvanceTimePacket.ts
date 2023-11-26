import {SmallEventPacket} from "./SmallEventPacket";

export interface SmallEventAdvanceTimePacket extends SmallEventPacket {
	time: number;
}