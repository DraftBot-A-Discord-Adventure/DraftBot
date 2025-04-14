import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorGuildLeaveData extends ReactionCollectorData {
	guildName!: string;

	isGuildDestroyed!: boolean;

	newChiefKeycloakId!: string;
}

export class ReactionCollectorGuildLeave extends ReactionCollector {
	private readonly guildName: string;

	private readonly newChiefKeycloakId: string;

	private readonly isGuildDestroyed: boolean;

	constructor(guildName: string, isGuildDestroyed: boolean, newChiefKeycloakId: string) {
		super();
		this.guildName = guildName;
		this.newChiefKeycloakId = newChiefKeycloakId;
		this.isGuildDestroyed = isGuildDestroyed;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorGuildLeaveData, {
				guildName: this.guildName,
				newChiefKeycloakId: this.newChiefKeycloakId,
				isGuildDestroyed: this.isGuildDestroyed
			})
		};
	}
}
