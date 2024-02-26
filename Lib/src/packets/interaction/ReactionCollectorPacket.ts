import {DraftBotPacket} from "../DraftBotPacket";

export class ReactionCollectorReactPacket extends DraftBotPacket {
	id!: string;

	keycloakId!: string;

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
	buildData<T extends ReactionCollectorData>(Packet: {new(): T}, {...args}: T): {
		type: string,
		data: T
	} {
		const instance = new Packet();
		Object.assign(instance, args);
		return {
			type: instance.constructor.name,
			data: instance
		};
	}

	buildReaction<T extends ReactionCollectorReaction>(Packet: {new(): T}, {...args}: T): {
		type: string,
		data: T
	} {
		const instance = new Packet();
		Object.assign(instance, args);
		return {
			type: instance.constructor.name,
			data: instance
		};
	}

	abstract creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket;
}