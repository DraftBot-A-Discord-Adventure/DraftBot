import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";
import { SexTypeShort } from "../../constants/StringConstants";

export class ReactionCollectorPetFreeData extends ReactionCollectorData {
	petId!: number;

	petSex!: SexTypeShort;

	petNickname?: string;

	isFeisty!: boolean;
}

export class ReactionCollectorPetFree extends ReactionCollector {
	private readonly petId: number;

	private readonly petSex: SexTypeShort;

	private readonly petNickname: string | undefined;

	private readonly isFeisty: boolean;

	constructor(petId: number, petSex: SexTypeShort, petNickname: string | undefined, isFeisty: boolean) {
		super();
		this.petId = petId;
		this.petSex = petSex;
		this.petNickname = petNickname;
		this.isFeisty = isFeisty;
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
				isFeisty: this.isFeisty
			})
		};
	}
}
