import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { Item } from "../../types/Item";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandSellPacketReq extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandSellNoItemErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandSellCancelErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandSellItemSuccessPacket extends DraftBotPacket {
	item!: Item;

	price!: number;
}
