import {SmallEventPacket} from "./SmallEventPacket";

export interface SmallEventBigBadPacket extends SmallEventPacket {
	kind: number;
	lifeLost: number;
	receivedStory: string;
	moneyLost: number;
}