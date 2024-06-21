import {ReactionCollector, ReactionCollectorCreationPacket, ReactionCollectorData, ReactionCollectorReaction} from "./ReactionCollectorPacket";

export class ReactionCollectorMerchantData extends ReactionCollectorData {
	itemCategory!: number;

	itemId!: number;

	price!: number;
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
				this.buildReaction(ReactionCollectorMerchantAcceptReaction, {}),
				this.buildReaction(ReactionCollectorMerchantRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorMerchantData, this.data)
		};
	}
}