import { ReactionCollectorData } from "./ReactionCollectorPacket";
import { ItemWithDetails } from "../../types/ItemWithDetails";

export class ReactionCollectorAnyShopSmallEventData extends ReactionCollectorData {
	item!: ItemWithDetails;

	price!: number;
}
