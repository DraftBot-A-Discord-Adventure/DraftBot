import {SmallEventPacket} from "./SmallEventPacket";

export class SmallEventGobletsGamePacket extends SmallEventPacket {
	malus!: string;

	goblet!: string;

	value!: number;
}