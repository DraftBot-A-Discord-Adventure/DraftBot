import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorGuildCreateData extends ReactionCollectorData {
	guildName!: string;

	price!: number;
}

export class ReactionCollectorGuildCreate extends ReactionCollector {
	private readonly guildName: string;

	private readonly price: number;

	constructor(guildName: string, price: number) {
		super();
		this.guildName = guildName;
		this.price = price;
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
				guildName: this.guildName,
				price: this.price
			})
		};
	}
}