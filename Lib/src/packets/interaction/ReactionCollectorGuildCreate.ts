import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorGuildCreateData extends ReactionCollectorData {
	guildName!: string;
}

export class ReactionCollectorGuildCreate extends ReactionCollector {
	private readonly guildName: string;

	constructor(guildName: string) {
		super();
		this.guildName = guildName;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorGuildCreateData, {
				guildName: this.guildName
			})
		};
	}
}
