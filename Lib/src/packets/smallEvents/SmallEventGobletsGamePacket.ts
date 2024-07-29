import {SmallEventPacket} from "./SmallEventPacket";
import {PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventGobletsGamePacket extends SmallEventPacket {
	malus!: string;

	goblet!: string;

	value!: number;
}