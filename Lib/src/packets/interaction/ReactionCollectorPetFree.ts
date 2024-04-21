import {ReactionCollector, ReactionCollectorCreationPacket, ReactionCollectorData, ReactionCollectorReaction} from "./ReactionCollectorPacket";

export class ReactionCollectorGobletsGameMetalReaction extends ReactionCollectorReaction {

}

export class ReactionCollectorGobletsGameBiggestReaction extends ReactionCollectorReaction {

}

export class ReactionCollectorGobletsGameSparklingReaction extends ReactionCollectorReaction {

}

export class ReactionCollectorGobletsGameData extends ReactionCollectorData {

}

export class ReactionCollectorPetFree extends ReactionCollector {
	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorGobletsGameMetalReaction, {}),
				this.buildReaction(ReactionCollectorGobletsGameBiggestReaction, {}),
				this.buildReaction(ReactionCollectorGobletsGameSparklingReaction, {})
			],
			data: this.buildData(ReactionCollectorGobletsGameData, {})
		};
	}
}