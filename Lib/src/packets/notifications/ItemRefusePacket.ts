import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class ItemRefusePacket extends DraftBotPacket {
	id!: number;

	category!: number;

	autoSell!: boolean;

	soldMoney!: number;
}