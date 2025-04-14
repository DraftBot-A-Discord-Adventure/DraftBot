import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorInteractOtherPlayersPoorData extends ReactionCollectorData {
	keycloakId!: string;

	rank?: number;
}

export class ReactionCollectorInteractOtherPlayersPoor extends ReactionCollector {
	private readonly keycloakId: string;

	private readonly rank?: number;

	constructor(keycloakId: string, rank?: number) {
		super();
		this.keycloakId = keycloakId;
		this.rank = rank;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorInteractOtherPlayersPoorData, {
				keycloakId: this.keycloakId,
				rank: this.rank
			})
		};
	}
}
