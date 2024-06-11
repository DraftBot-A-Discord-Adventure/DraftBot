import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorPetFreeData extends ReactionCollectorData {
	petId!: number;

	petSex!: string;

	petNickname?: string;

	freeCost!: number;
}

export class ReactionCollectorPetFree extends ReactionCollector {
	private readonly petId: number;

	private readonly petSex: string;

	private readonly petNickname: string | undefined;

	private readonly freeCost: number;

	constructor(petId: number, petSex: string, petNickname: string | undefined, freeCost: number) {
		super();
		this.petId = petId;
		this.petSex = petSex;
		this.petNickname = petNickname;
		this.freeCost = freeCost;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorAcceptReaction, {}),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorPetFreeData, {
				petId: this.petId,
				petSex: this.petSex,
				petNickname: this.petNickname,
				freeCost: this.freeCost
			})
		};
	}
}