import { SmallEventPacket } from "./SmallEventPacket";
import { SmallEventBigBadKind } from "../../types/SmallEventBigBadKind";
import {
	PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventBigBadPacket extends SmallEventPacket {
	kind!: SmallEventBigBadKind;

	lifeLost!: number;

	receivedStory!: string;

	moneyLost!: number;

	effectId?: string;
}
