import {SmallEventPacket} from "./SmallEventPacket";

export interface SmallEventGobletsGamePacket extends SmallEventPacket {
    malus: string,
	goblet: string,
	value: number,
}