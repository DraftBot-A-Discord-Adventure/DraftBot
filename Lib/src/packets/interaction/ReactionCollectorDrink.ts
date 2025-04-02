import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";
import { ItemWithDetails } from "../../types/ItemWithDetails";

export class ReactionCollectorDrinkData extends ReactionCollectorData {
	potion!: ItemWithDetails;
}

export class ReactionCollectorDrink extends ReactionCollector {
	private readonly potion!: ItemWithDetails;

	constructor(potion: ItemWithDetails) {
		super();
		this.potion = potion;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorDrinkData, {
				potion: this.potion
			})
		};
	}
}
