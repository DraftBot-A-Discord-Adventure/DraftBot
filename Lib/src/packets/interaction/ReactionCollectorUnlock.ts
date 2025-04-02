import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorUnlockData extends ReactionCollectorData {
	unlockedKeycloakId!: string;
}

export class ReactionCollectorUnlock extends ReactionCollector {
	private readonly unlockedKeycloakId: string;

	constructor(unlockedKeycloakId: string) {
		super();
		this.unlockedKeycloakId = unlockedKeycloakId;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorUnlockData, {
				unlockedKeycloakId: this.unlockedKeycloakId
			})
		};
	}
}
