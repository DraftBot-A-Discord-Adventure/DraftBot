import {
	ReactionCollector,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorPveFightData extends ReactionCollectorData {
	monster!: {
		id: string,
		level: number,
		energy: number,
		attack: number,
		defense: number,
		speed: number
	};
}

export class ReactionCollectorPveFightReactionValidate extends ReactionCollectorReaction {

}

export class ReactionCollectorPveFightReactionWait extends ReactionCollectorReaction {

}

export class ReactionCollectorPveFight extends ReactionCollector {
	private readonly data: ReactionCollectorPveFightData;

	constructor(data: ReactionCollectorPveFightData) {
		super();
		this.data = data;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorPveFightReactionValidate, {}),
				this.buildReaction(ReactionCollectorPveFightReactionWait, {})
			],
			data: this.buildData(ReactionCollectorPveFightData, this.data)
		};
	}
}