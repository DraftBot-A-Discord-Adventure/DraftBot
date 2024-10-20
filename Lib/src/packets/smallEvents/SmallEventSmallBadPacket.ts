import {PacketDirection, sendablePacket} from "../DraftBotPacket";
import {SmallEventPacket} from "./SmallEventPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventSmallBadPacket extends SmallEventPacket {
	moneyLost!: number;

	timeLost! : number;

	healthLost!: number;
}