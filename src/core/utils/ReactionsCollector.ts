import {RandomUtils} from "./RandomUtils";
import {ReactionCollectorCreationPacket, ReactionCollectorEnded, ReactionCollectorReactPacket, ReactionCollectorType} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DraftBotPacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Constants} from "../Constants";
import {BlockingUtils} from "./BlockingUtils";
import {sendPacketsToContext} from "../../../../Lib/src/packets/PacketUtils";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";

type CollectCallback = (collector: ReactionCollector, playerId: number, reaction: string, response: DraftBotPacket[]) => void | Promise<void>;

type EndCallback = (collector: ReactionCollector, response: DraftBotPacket[]) => void | Promise<void>;

type FilterFunction = (playerId: number, reaction: string) => boolean | Promise<boolean>;

type ChoiceReactionCallback<T> = (collector: ChoiceReactionCollector, playerId: number, item: T, response: DraftBotPacket[]) => Promise<void>

export type CollectorFunctions = {
	collect?: CollectCallback;
	end?: EndCallback;
	filter?: FilterFunction;
};

export type CollectorOptions = {
	collectorType?: ReactionCollectorType;
	reactions?: string[];
	time?: number;
};

export type ReactionCollectorOptions<T> = {
	allowedPlayerIds?: number[],
	choices?: T[],
	callback?: ChoiceReactionCallback<T>,
}

export class ReactionCollector {
	protected static collectors: Map<string, ReactionCollector>;

	protected id: string;

	protected readonly reactions: string[];

	protected readonly filter: FilterFunction;

	protected readonly endTime: number;

	protected readonly time: number;

	protected readonly collectCallback: CollectCallback;

	protected readonly collectorType: ReactionCollectorType;

	protected readonly context: PacketContext;

	protected readonly endCallback: EndCallback;

	protected hasEnded: boolean;


	protected constructor(context: PacketContext, collectorOptions: CollectorOptions, collectorFunctions: CollectorFunctions) {
		this.collectorType = collectorOptions.collectorType;
		this.reactions = collectorOptions.reactions;
		this.filter = collectorFunctions.filter;
		this.time = collectorOptions.time;
		this.endTime = Date.now() + this.time;
		this.collectCallback = collectorFunctions.collect;
		this.context = context;
		this.endCallback = collectorFunctions.end;
	}

	public static async reactPacket(_client: WebsocketClient, packet: ReactionCollectorReactPacket, response: DraftBotPacket[]): Promise<void> {
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
		{collectorType, reactions, time = Constants.MESSAGES.COLLECTOR_TIME}: CollectorOptions,
		{filter, collect, end = null}: CollectorFunctions
	): GenericReactionCollector {
		const collector = new GenericReactionCollector(context,
			{collectorType, reactions, time},
			{filter, collect, end});
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
		const filter = (playerId: number, reaction: string): boolean => allowedPlayerIds.includes(playerId) && reactions.includes(reaction);
		const callbackOverload: CollectCallback = async (collector: ValidationReactionCollector, playerId: number, reaction: string, response: DraftBotPacket[]) => {
			collector.validated = reaction === reactions[0];
			await callback(collector, playerId, reaction, response);
		};

		const collector = new ValidationReactionCollector(
			context,
			{collectorType, reactions, time},
			{filter, collect: callbackOverload, end: endCallback}
		);
		ReactionCollector.register(collector);
		return collector;
	}

	public isValidated(): boolean {
		return this.validated;
	}
}

export class ChoiceReactionCollector extends ReactionCollector {
	public static create<T>(
		context: PacketContext,
		{collectorType, time = Constants.MESSAGES.COLLECTOR_TIME}: CollectorOptions,
		{allowedPlayerIds, choices, callback}: ReactionCollectorOptions<T>,
		endCallback: EndCallback = null
	): ChoiceReactionCollector {
		const reactions: string[] = [];
		const reactionsMap = new Map<string, T>();
		for (let i = 0; i < choices.length; ++i) {
			reactions.push(Constants.REACTIONS.NUMBERS[i]);
			reactionsMap.set(Constants.REACTIONS.NUMBERS[i], choices[i]);
		}
		const filter: FilterFunction = (playerId, reaction) => allowedPlayerIds.includes(playerId) && reactions.includes(reaction);
		const callbackOverload: CollectCallback = async (collector: ChoiceReactionCollector, playerId: number, reaction: string, response: DraftBotPacket[]) => {
			const item = reactionsMap.get(reaction);
			await callback(collector, playerId, item, response);
		};

		const collector = new ChoiceReactionCollector(
			context,
			{
				collectorType,
				reactions,
				time
			},
			{
				collect: callbackOverload,
				end: endCallback,
				filter
			}
		);
		ReactionCollector.register(collector);
		return collector;
	}
}