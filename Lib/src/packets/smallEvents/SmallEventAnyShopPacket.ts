import {SmallEventPacket} from "./SmallEventPacket";
import {PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.NONE)
export class SmallEventAnyShopPacket extends SmallEventPacket {
	isValidated?: boolean;

	canBuy?: boolean;
}