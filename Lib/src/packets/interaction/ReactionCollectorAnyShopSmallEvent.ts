import {ReactionCollectorData} from "./ReactionCollectorPacket";
import {ItemWithDetails} from "../../interfaces/ItemWithDetails";

export class ReactionCollectorAnyShopSmallEventData extends ReactionCollectorData {
	item!: ItemWithDetails;

	price!: number;
}