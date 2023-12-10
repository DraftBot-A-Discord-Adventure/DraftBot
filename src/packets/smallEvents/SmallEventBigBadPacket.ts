import {SmallEventPacket} from "./SmallEventPacket";

export class SmallEventBigBadPacket extends SmallEventPacket {
	kind!: number;

	lifeLost!: number;

	receivedStory!: string;

	moneyLost!: number;
}