import {SmallEventPacket} from "./SmallEventPacket";

export class SmallEventAnyShopPacket extends SmallEventPacket {
	isValidated?: boolean;

	canBuy?: boolean;
}