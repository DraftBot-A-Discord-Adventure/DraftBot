import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorGuildElderData extends ReactionCollectorData {
	promotedKeycloakId!: string;
}

export class ReactionCollectorGuildElder extends ReactionCollector {
	private readonly promotedKeycloakId: string;

	constructor(promotedKeycloakId: string) {
		super();
		this.promotedKeycloakId = promotedKeycloakId;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorGuildElderData, {
				promotedKeycloakId: this.promotedKeycloakId
			})
		};
	}
}