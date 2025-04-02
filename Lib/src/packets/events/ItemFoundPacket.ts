import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { ItemWithDetails } from "../../types/ItemWithDetails";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class ItemFoundPacket extends DraftBotPacket {
	itemWithDetails!: ItemWithDetails;
}
