import {ReactionCollector, ReactionCollectorCreationPacket, ReactionCollectorData, ReactionCollectorReaction} from "./ReactionCollectorPacket";

export class ReactionCollectorItemChoiceData extends ReactionCollectorData {
	itemCategory!: number;

	itemId!: number;
}

export class ReactionCollectorItemChoiceItemReaction extends ReactionCollectorReaction {
	slot!: number;

	itemCategory!: number;

	itemId!: number;
}

export class ReactionCollectorItemChoiceRefuseReaction extends ReactionCollectorReaction {

}

export class ReactionCollectorItemChoice extends ReactionCollector {
	private readonly data: ReactionCollectorItemChoiceData;

	private readonly items: ReactionCollectorItemChoiceItemReaction[];

	constructor(data: ReactionCollectorItemChoiceData, items: ReactionCollectorItemChoiceItemReaction[]) {
		super();
		this.data = data;
		this.items = items;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		const reactions = [];
		for (const item of this.items) {
			reactions.push(this.buildReaction(ReactionCollectorItemChoiceItemReaction, item));
		}
		reactions.push(this.buildReaction(ReactionCollectorItemChoiceRefuseReaction, {}));

		return {
			id,
			endTime,
			reactions,
			data: this.buildData(ReactionCollectorItemChoiceData, this.data)
		};
	}
}