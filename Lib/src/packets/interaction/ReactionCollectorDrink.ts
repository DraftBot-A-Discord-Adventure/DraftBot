import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorDrinkData extends ReactionCollectorData {
	potionId!: number;
}

export class ReactionCollectorDrink extends ReactionCollector {
	private readonly potionId!: number;

	constructor(potionId: number) {
		super();
		this.potionId = potionId;
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
				potionId: this.potionId
			})
		};
	}
}