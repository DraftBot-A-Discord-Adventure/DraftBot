import { SmallEventPacket } from "./SmallEventPacket";
import {
	PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventUltimateFoodMerchantPacket extends SmallEventPacket {
	interactionName!: string;

	amount?: number;
}
