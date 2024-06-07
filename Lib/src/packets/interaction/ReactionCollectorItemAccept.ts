import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorItemAcceptData extends ReactionCollectorData {
	itemCategory!: number;

	itemId!: number;
}

export class ReactionCollectorItemAccept extends ReactionCollector {
	private readonly itemId: number;

	private readonly itemCategory: number;

	constructor(itemId: number, itemCategory: number) {
		super();
		this.itemId = itemId;
		this.itemCategory = itemCategory;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorItemAcceptData, {
				itemId: this.itemId,
				itemCategory: this.itemCategory
			})
		};
	}
}