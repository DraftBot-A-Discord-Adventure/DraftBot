import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorGuildLeaveData extends ReactionCollectorData {
	guildName!: string;

	newChiefKeycloakId!: string;

	guildIsDestroyed!: boolean;
}

export class ReactionCollectorGuildLeave extends ReactionCollector {
	private readonly guildName: string;

	private readonly newChiefKeycloakId: string;

	private readonly guildIsDestroyed: boolean;

	constructor(guildName: string, newChiefKeycloakId: string, guildIsDestroyed: boolean) {
		super();
		this.guildName = guildName;
		this.newChiefKeycloakId = newChiefKeycloakId;
		this.guildIsDestroyed = guildIsDestroyed;
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
				guildIsDestroyed: this.guildIsDestroyed
			})
		};
	}
}