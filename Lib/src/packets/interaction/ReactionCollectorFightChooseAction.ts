import {
	ReactionCollector,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorFightChooseActionReaction extends ReactionCollectorReaction {
	id!: string;
}

export class ReactionCollectorFightChooseActionData extends ReactionCollectorData {
	fighterKeycloakId!: string;
}

export class ReactionCollectorFightChooseAction extends ReactionCollector {
	private readonly reactions: ReactionCollectorFightChooseActionReaction[];

	private readonly fighterKeycloackId: string;


	constructor(fighterKeycloakId: string, reactions: string[]) {
		super();
		this.reactions = reactions.map(r => ({
			id: r
		}));
		this.fighterKeycloackId = fighterKeycloakId;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		const reactions = [];
		for (const reaction of this.reactions) {
			reactions.push(this.buildReaction(ReactionCollectorFightChooseActionReaction, reaction));
		}

		return {
			id,
			endTime,
			reactions,
			data: this.buildData(ReactionCollectorFightChooseActionData, {
				fighterKeycloakId: this.fighterKeycloackId
			})
		};
	}
}
