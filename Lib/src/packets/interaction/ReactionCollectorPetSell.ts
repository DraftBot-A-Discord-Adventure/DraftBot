import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";
import { OwnedPet } from "../../types/OwnedPet";

export class ReactionCollectorPetSellData extends ReactionCollectorData {
	sellerKeycloakId!: string;

	price!: number;

	isGuildAtMaxLevel!: boolean;

	pet!: OwnedPet;
}

export class ReactionCollectorPetSell extends ReactionCollector {
	private readonly sellerKeycloakId: string;

	private readonly price: number;

	private readonly isGuildAtMaxLevel: boolean;

	private readonly pet: OwnedPet;

	constructor(sellerKeycloakId: string, price: number, isGuildAtMaxLevel: boolean, pet: OwnedPet) {
		super();
		this.sellerKeycloakId = sellerKeycloakId;
		this.price = price;
		this.isGuildAtMaxLevel = isGuildAtMaxLevel;
		this.pet = pet;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorPetSellData, {
				sellerKeycloakId: this.sellerKeycloakId,
				price: this.price,
				isGuildAtMaxLevel: this.isGuildAtMaxLevel,
				pet: this.pet
			})
		};
	}
}
