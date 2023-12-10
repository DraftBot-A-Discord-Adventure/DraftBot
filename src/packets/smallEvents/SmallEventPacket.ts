import {DraftBotPacket} from "../DraftBotPacket";

export class SmallEventPacket extends DraftBotPacket {}

export class SmallEventAddSomething extends SmallEventPacket {
	amount!: number;
}