import {SmallEventPacket} from "./SmallEventPacket";

export class SmallEventBotFactsPacket extends SmallEventPacket {
	information!: string;

	infoResult!: number;

	infoComplement?: number;
}