import {
	ReactionCollector, ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorReaction, ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";
import {ItemWithDetails} from "../../interfaces/ItemWithDetails";

export class ReactionCollectorMerchantData extends ReactionCollectorData {
	item!: ItemWithDetails;

	price!: number;

	tip!: boolean;
}

export class ReactionCollectorMerchantAcceptReaction extends ReactionCollectorReaction {

}

export class ReactionCollectorMerchantRefuseReaction extends ReactionCollectorReaction {

}

export class ReactionCollectorMerchant extends ReactionCollector {
	private readonly data: ReactionCollectorMerchantData;

	constructor(data: ReactionCollectorMerchantData) {
		super();
		this.data = data;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorMerchantData, this.data)
		};
	}
}