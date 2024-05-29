import {SmallEventPacket} from "./SmallEventPacket";
import {SmallEventBigBadKind} from "../../enums/SmallEventBigBadKind";

export class SmallEventBigBadPacket extends SmallEventPacket {
	kind!: SmallEventBigBadKind;

	lifeLost!: number;

	receivedStory!: string;

	moneyLost!: number;

	effectId?: string;
}