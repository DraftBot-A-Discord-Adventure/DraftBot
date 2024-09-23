import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";
import {ItemWithDetails} from "../../interfaces/ItemWithDetails";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class ItemAcceptPacket extends DraftBotPacket {
	itemWithDetails!: ItemWithDetails;
}