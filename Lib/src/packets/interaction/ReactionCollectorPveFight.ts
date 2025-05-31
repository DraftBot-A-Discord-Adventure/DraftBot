import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorPveFightData extends ReactionCollectorData {
	monster!: {
		id: string;
		level: number;
		energy: number;
		attack: number;
		defense: number;
		speed: number;
	};

	mapId!: number;
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
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorPveFightData, this.data)
		};
	}
}
