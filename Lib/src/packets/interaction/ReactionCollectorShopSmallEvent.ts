import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";
import { ReactionCollectorAnyShopSmallEventData } from "./ReactionCollectorAnyShopSmallEvent";

export class ReactionCollectorShopSmallEventData extends ReactionCollectorAnyShopSmallEventData {
}

export class ReactionCollectorShopSmallEvent extends ReactionCollector {
	private readonly data: ReactionCollectorShopSmallEventData;

	constructor(data: ReactionCollectorShopSmallEventData) {
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
			data: this.buildData(ReactionCollectorShopSmallEventData, this.data)
		};
	}
}
