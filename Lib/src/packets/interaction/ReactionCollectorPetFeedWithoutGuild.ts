import {
	ReactionCollector, ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";
import {OwnedPet} from "../../types/OwnedPet";

export class ReactionCollectorPetFeedWithoutGuildData extends ReactionCollectorData {
	pet!: OwnedPet;

	price!: number;
}

export class ReactionCollectorPetFeedWithoutGuild extends ReactionCollector {
	private readonly pet: OwnedPet;

	private readonly price: number;

	constructor(pet: OwnedPet, price: number) {
		super();
		this.pet = pet;
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
			data: this.buildData(ReactionCollectorPetFeedWithoutGuildData, {
				pet: this.pet,
				price: this.price
			})
		};
	}
}