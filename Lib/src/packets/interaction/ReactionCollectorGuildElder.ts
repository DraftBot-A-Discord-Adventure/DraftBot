import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorGuildElderData extends ReactionCollectorData {
	guildName!: string;

	promotedKeycloakId!: string;
}

export class ReactionCollectorGuildElder extends ReactionCollector {
	private readonly guildName: string;

	private readonly promotedKeycloakId: string;

	constructor(guildName: string, promotedKeycloakId: string) {
		super();
		this.guildName = guildName;
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
				guildName: this.guildName,
				promotedKeycloakId: this.promotedKeycloakId
			})
		};
	}
}
