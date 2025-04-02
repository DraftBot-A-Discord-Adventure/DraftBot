import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { Item } from "../../types/Item";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class ItemRefusePacket extends DraftBotPacket {
	item!: Item;

	autoSell!: boolean;

	soldMoney!: number;
}
