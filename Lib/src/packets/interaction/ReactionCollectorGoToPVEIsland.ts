import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorGoToPVEIslandData extends ReactionCollectorData {
	price!: number;

	energy!: {
		current: number;
		max: number;
	};
}

export class ReactionCollectorGoToPVEIsland extends ReactionCollector {
	private readonly price: number;

	private readonly currentEnergy: number;

	private readonly maxEnergy: number;

	constructor(price: number, currentEnergy: number, maxEnergy: number) {
		super();
		this.price = price;
		this.currentEnergy = currentEnergy;
		this.maxEnergy = maxEnergy;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorGoToPVEIslandData, {
				price: this.price,
				energy: {
					current: this.currentEnergy,
					max: this.maxEnergy
				}
			})
		};
	}
}
