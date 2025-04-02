import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";
import { ItemWithDetails } from "../../types/ItemWithDetails";

export class ReactionCollectorItemAcceptData extends ReactionCollectorData {
	itemWithDetails!: ItemWithDetails;
}

export class ReactionCollectorItemAccept extends ReactionCollector {
	private readonly itemWithDetails: ItemWithDetails;

	constructor(itemWithDetails: ItemWithDetails) {
		super();
		this.itemWithDetails = itemWithDetails;
	}

	creationPacket(id: string, endTime: number, mainPacket = true): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorItemAcceptData, {
				itemWithDetails: this.itemWithDetails
			}),
			mainPacket
		};
	}
}
