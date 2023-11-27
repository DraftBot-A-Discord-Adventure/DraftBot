import {DraftBotPacket} from "../DraftBotPacket";

export interface SmallEventPacket extends DraftBotPacket {}

export interface SmallEventAddSomething extends SmallEventPacket {
	amount: number;
}