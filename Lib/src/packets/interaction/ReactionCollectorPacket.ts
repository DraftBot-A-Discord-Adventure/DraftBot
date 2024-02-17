import {DraftBotPacket} from "../DraftBotPacket";

export class ReactionCollectorReactPacket extends DraftBotPacket {
	id!: string;

	playerId!: number;

	reactionIndex!: number;
}

export class ReactionCollectorEnded extends DraftBotPacket {

}

export abstract class ReactionCollectorReaction {

}

export abstract class ReactionCollectorData {

}

export class ReactionCollectorCreationPacket extends DraftBotPacket {
	id!: string;

	data!: {
		type: string,
		data: ReactionCollectorData
	};

	reactions!: {
		type: string,
		data: ReactionCollectorReaction
	}[];

	endTime!: number;
}

export abstract class ReactionCollector {
	buildData<T extends ReactionCollectorData>(data: T): {
		type: string,
		data: T
	} {
		return {
			type: data.constructor.name,
			data
		};
	}

	buildReaction<T extends ReactionCollectorReaction>(reaction: T): {
		type: string,
		data: T
	} {
		return {
			type: reaction.constructor.name,
			data: reaction
		};
	}

	abstract creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket;
}