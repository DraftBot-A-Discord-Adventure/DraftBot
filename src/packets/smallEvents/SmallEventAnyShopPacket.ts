import {SmallEventPacket} from "./SmallEventPacket";

export interface SmallEventAnyShopPacket extends SmallEventPacket {
	isValidated?: boolean;
	canBuy?: boolean;
}