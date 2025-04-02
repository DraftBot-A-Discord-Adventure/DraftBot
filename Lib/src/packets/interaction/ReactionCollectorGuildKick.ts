import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorGuildKickData extends ReactionCollectorData {
	guildName!: string;

	kickedKeycloakId!: string;
}

export class ReactionCollectorGuildKick extends ReactionCollector {
	private readonly guildName: string;

	private readonly kickedKeycloakId: string;

	constructor(guildName: string, kickedKeycloakId: string) {
		super();
		this.guildName = guildName;
		this.kickedKeycloakId = kickedKeycloakId;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorGuildKickData, {
				guildName: this.guildName,
				kickedKeycloakId: this.kickedKeycloakId
			})
		};
	}
}
