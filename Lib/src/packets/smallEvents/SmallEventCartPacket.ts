import {PacketDirection, sendablePacket} from "../DraftBotPacket";
import {SmallEventPacket} from "./SmallEventPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventCartPacket extends SmallEventPacket {
	displayedDestination!: {
		isDisplayed: boolean,
		id?: number,
		type?: string
	};

	price!: number;
}