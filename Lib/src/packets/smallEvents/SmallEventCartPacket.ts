import {
	PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { SmallEventPacket } from "./SmallEventPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventCartPacket extends SmallEventPacket {
	isScam!: boolean;

	isDisplayed!: boolean;

	travelDone!: {
		isAccepted: boolean;
		hasEnoughMoney: boolean;
	};
}
