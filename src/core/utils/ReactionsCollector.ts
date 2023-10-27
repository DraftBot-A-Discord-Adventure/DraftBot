import {RandomUtils} from "./RandomUtils";
import {ReactionCollectorCreationPacket, ReactionCollectorEnded, ReactionCollectorReactPacket, ReactionCollectorType} from "draftbot_lib/packets/interaction/ReactionCollectorPacket";
import {DraftBotPacket, PacketContext} from "draftbot_lib/packets/DraftBotPacket";
import {Constants} from "../Constants";
import {BlockingUtils} from "./BlockingUtils";
import {sendPacketsToContext} from "draftbot_lib/packets/PacketUtils";

type CollectCallback = (collector: ReactionCollector, playerId: number, reaction: string, response: DraftBotPacket[]) => Promise<void>;

type EndCallback = (collector: ReactionCollector, response: DraftBotPacket[]) => Promise<void>;

export class ReactionCollector {
	protected static collectors: Map<string, ReactionCollector>;

	protected id: string;

	protected readonly reactions: string[];

	protected readonly filter: (playerId: number, reaction: string) => Promise<boolean>;

	protected readonly endTime: number;

	protected readonly time: number;

	protected readonly collectCallback: CollectCallback;

	protected readonly collectorType: ReactionCollectorType;

	protected readonly context: PacketContext;

	protected readonly endCallback: EndCallback;

	protected hasEnded: boolean;


	protected constructor(context: PacketContext, collectorType: ReactionCollectorType, reactions: string[], filter: (playerId: number, reaction: string) => Promise<boolean>, time: number, collectCallback: CollectCallback, endCallback: EndCallback) {
		this.collectorType = collectorType;
		this.reactions = reactions;
		this.filter = filter;
		this.time = time;
		this.endTime = Date.now() + time;
		this.collectCallback = collectCallback;
		this.context = context;
		this.endCallback = endCallback;
	}

	public static async reactPacket(socket: WebSocket, packet: ReactionCollectorReactPacket, response: DraftBotPacket[]): Promise<void> {
		const collector: ReactionCollector = ReactionCollector.collectors.get(packet.id);
		if (!collector || collector.hasEnded) {
			const packet: ReactionCollectorEnded = {};
			response.push(packet);
		}
		else {
			await collector.react(packet.playerId, packet.reaction, response);
		}
	}

	protected static register(collector: ReactionCollector): void {
		collector.id = RandomUtils.draftbotRandom.uuid4();
		ReactionCollector.collectors.set(collector.id, collector);
		setTimeout(collector.end, collector.endTime - Date.now());
	}

	public async end(): Promise<void> {
		if (!this.hasEnded) {
			this.hasEnded = true;
			ReactionCollector.collectors.delete(this.id);
			if (this.endCallback) {
				const response: DraftBotPacket[] = [];
				await this.endCallback(this, response);
				sendPacketsToContext(this.context, response);
			}
		}
	}

	public getPacket(): ReactionCollectorCreationPacket {
		return {
			reactions: this.reactions,
			endTime: this.endTime,
			id: this.id,
			type: this.collectorType
		};
	}

	public block(playerId: number, reason: string): ReactionCollector {
		BlockingUtils.blockPlayerUntil(playerId, reason, this.endTime);
		return this;
	}

	private async react(playerId: number, reaction: string, response: DraftBotPacket[]): Promise<void> {
		if (await this.filter(playerId, reaction)) {
			if (this.collectCallback) {
				await this.collectCallback(this, playerId, reaction, response);
			}
		}
	}
}

export class GenericReactionCollector extends ReactionCollector {
	public static create(
		context: PacketContext,
		collectorType: ReactionCollectorType,
		reactions: string[],
		filter: (playerId: number, reaction: string) => Promise<boolean>,
		collectCallback: CollectCallback,
		endCallback: EndCallback = null,
		time: number = Constants.MESSAGES.COLLECTOR_TIME
	): GenericReactionCollector {
		const collector = new GenericReactionCollector(context, collectorType, reactions, filter, time, collectCallback, endCallback);
		ReactionCollector.register(collector);
		return collector;
	}
}

export class ValidationReactionCollector extends ReactionCollector {
	private validated: boolean = false;

	public static create(
		context: PacketContext,
		collectorType: ReactionCollectorType,
		allowedPlayerIds: number[],
		callback: CollectCallback,
		endCallback: EndCallback = null,
		time: number = Constants.MESSAGES.COLLECTOR_TIME
	): ValidationReactionCollector {
		const reactions = [Constants.REACTIONS.VALIDATE_REACTION, Constants.REACTIONS.REFUSE_REACTION];
		const filter = (playerId: number, reaction: string) => Promise.resolve(allowedPlayerIds.includes(playerId) && reactions.includes(reaction));
		const callbackOverload: CollectCallback = async (collector: ValidationReactionCollector, playerId: number, reaction: string, response: DraftBotPacket[]) => {
			collector.validated = reaction === reactions[0];
			await callback(collector, playerId, reaction, response);
		};

		const collector = new ValidationReactionCollector(
			context,
			collectorType,
			reactions,
			filter,
			time,
			callbackOverload,
			endCallback
		);
		ReactionCollector.register(collector);
		return collector;
	}

	public isValidated(): boolean {
		return this.validated;
	}
}

export class ChoiceReactionCollector<T> extends ReactionCollector {
	public static create<T>(
		context: PacketContext,
		collectorType: ReactionCollectorType,
		allowedPlayerIds: number[],
		choices: T[],
		callback: (collector: ChoiceReactionCollector<T>, playerId: number, item: T, response: DraftBotPacket[]) => Promise<void>,
		endCallback: EndCallback = null,
		time: number = Constants.MESSAGES.COLLECTOR_TIME
	): ChoiceReactionCollector<T> {
		const reactions: string[] = [];
		const reactionsMap = new Map<string, T>();
		for (let i = 0; i < choices.length; ++i) {
			reactions.push(Constants.REACTIONS.NUMBERS[i]);
			reactionsMap.set(Constants.REACTIONS.NUMBERS[i], choices[i]);
		}
		const filter = (playerId: number, reaction: string) => Promise.resolve(allowedPlayerIds.includes(playerId) && reactions.includes(reaction));
		const callbackOverload: CollectCallback = async (collector: ChoiceReactionCollector<T>, playerId: number, reaction: string, response: DraftBotPacket[]) => {
			const item = reactionsMap.get(reaction);
			await callback(collector, playerId, item, response);
		};

		const collector = new ChoiceReactionCollector(
			context,
			collectorType,
			reactions,
			filter,
			time,
			callbackOverload,
			endCallback
		);
		ReactionCollector.register(collector);
		return collector;
	}
}