import {RandomUtils} from "./RandomUtils";
import {ReactionCollectorCreationPacket, ReactionCollectorEnded, ReactionCollectorReactPacket, ReactionCollectorType} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DraftBotPacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Constants} from "../Constants";
import {BlockingUtils} from "./BlockingUtils";
import {sendPacketsToContext} from "../../../../Lib/src/packets/PacketUtils";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";

type CollectCallback = (collector: ReactionCollector, reaction: string, playerId: number, response: DraftBotPacket[]) => void | Promise<void>;

export type EndCallback = (collector: ReactionCollector, response: DraftBotPacket[]) => void | Promise<void>;

type FilterFunction = (playerId: number, reaction: string) => boolean | Promise<boolean>;

type ChoiceReactionCallback<T> = (collector: ChoiceReactionCollector, item: T, playerId: number, response: DraftBotPacket[]) => Promise<void>

export type CollectorFunctions = {
	collect?: CollectCallback;
	end?: EndCallback;
	filter?: FilterFunction;
};

export type CollectorOptions = {
	collectorType?: ReactionCollectorType;
	reactions?: string[];
	time?: number;
	allowedPlayerIds?: number[];
	reactionLimit?: number;
};

export type ReactionCollectorOptions<T> = {
	allowedPlayerIds: number[],
	collectorType: ReactionCollectorType
	choices: T[],
	callback?: ChoiceReactionCallback<T>,
	time?: number,
	reactionLimit?: number
};

type ReactionInfo = {
	playerId: number,
	emoji: string
};

export function createDefaultFilter(reactions: string[], allowedPlayerIds: number[]): FilterFunction {
	return (playerId, reaction) => allowedPlayerIds.includes(playerId) && reactions.includes(reaction);
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

	protected readonly reactionLimit: number;

	protected hasEnded: boolean;

	protected reactionsHistory: ReactionInfo[] = [];

	protected constructor(context: PacketContext, collectorOptions: CollectorOptions, collectorFunctions: CollectorFunctions) {
		this.collectorType = collectorOptions.collectorType;
		this.reactions = collectorOptions.reactions;
		this.filter = collectorFunctions.filter;
		this.time = collectorOptions.time;
		this.endTime = Date.now() + this.time;
		this.collectCallback = collectorFunctions.collect;
		this.context = context;
		this.endCallback = collectorFunctions.end;
		this.reactionLimit = collectorOptions.reactionLimit;
	}

	public static async reactPacket(_client: WebsocketClient, packet: ReactionCollectorReactPacket, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
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

	public allowEndReaction(): this {
		this.reactions.push(Constants.REACTIONS.NOT_REPLIED_REACTION);
		return this;
	}

	public async end(): Promise<void> {
		if (this.hasEnded) {
			return;
		}
		this.hasEnded = true;
		ReactionCollector.collectors.delete(this.id);
		if (this.endCallback) {
			const response: DraftBotPacket[] = [];
			await this.endCallback(this, response);
			sendPacketsToContext(this.context, response);
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

	public block(playerId: number, reason: string): this {
		BlockingUtils.blockPlayerUntil(playerId, reason, this.endTime);
		return this;
	}

	public getReactionsHistory(): ReactionInfo[] {
		return this.reactionsHistory;
	}

	public getFirstReaction(): ReactionInfo {
		return this.reactionsHistory[0] ?? {playerId: null, emoji: null};
	}

	private async react(playerId: number, reaction: string, response: DraftBotPacket[]): Promise<void> {
		if (!await this.filter(playerId, reaction)) {
			return;
		}
		this.reactionsHistory.push({
			playerId,
			emoji: reaction
		});
		if (this.collectCallback) {
			await this.collectCallback(this, reaction, playerId, response);
		}
		if (this.reactionsHistory.length >= this.reactionLimit && this.reactionLimit > 0) {
			await this.end();
		}
	}
}

export class GenericReactionCollector extends ReactionCollector {
	public static create(
		context: PacketContext,
		collectorOptions: CollectorOptions, {
			filter = createDefaultFilter(collectorOptions.reactions, collectorOptions.allowedPlayerIds),
			collect = null,
			end
		}: CollectorFunctions
	): GenericReactionCollector {
		if (!collectorOptions.reactionLimit) {
			collectorOptions.reactionLimit = Constants.MESSAGES.DEFAULT_REACTION_LIMIT;
		}
		if (!collectorOptions.time) {
			collectorOptions.time = Constants.MESSAGES.COLLECTOR_TIME;
		}
		const collector = new GenericReactionCollector(context,
			collectorOptions,
			{filter, collect, end});
		ReactionCollector.register(collector);
		return collector;
	}
}

export class ValidationReactionCollector extends ReactionCollector {
	private validated: boolean = false;

	public static create(
		context: PacketContext,
		collectorOptions: CollectorOptions,
		endCallback: EndCallback
	): ValidationReactionCollector {
		const reactions = [Constants.REACTIONS.VALIDATE_REACTION, Constants.REACTIONS.REFUSE_REACTION];
		const callbackOverload: CollectCallback = (collector: ValidationReactionCollector, reaction: string) => {
			collector.validated = reaction === reactions[0];
		};

		collectorOptions.reactions = reactions;
		collectorOptions.reactionLimit = Constants.MESSAGES.DEFAULT_REACTION_LIMIT;

		const collector = new ValidationReactionCollector(
			context,
			collectorOptions,
			{collect: callbackOverload, end: endCallback}
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
		collectorOptions: ReactionCollectorOptions<T>,
		defaultEndCallback: EndCallback
	): ChoiceReactionCollector {
		const options: CollectorOptions = {
			allowedPlayerIds: collectorOptions.allowedPlayerIds,
			collectorType: collectorOptions.collectorType,
			time: collectorOptions.time ?? Constants.MESSAGES.COLLECTOR_TIME,
			reactionLimit: collectorOptions.reactionLimit ?? Constants.MESSAGES.DEFAULT_REACTION_LIMIT
		};
		const reactions: string[] = [];
		const reactionsMap = new Map<string, T>();
		for (let i = 0; i < collectorOptions.choices.length; ++i) {
			reactions.push(Constants.REACTIONS.NUMBERS[i]);
			reactionsMap.set(Constants.REACTIONS.NUMBERS[i], collectorOptions.choices[i]);
		}
		options.reactions = reactions;
		const endOverload: EndCallback = async (collector, response) => {
			const choice = reactionsMap.get(collector.getFirstReaction().emoji);
			if (choice) {
				await collectorOptions.callback(collector, choice, collector.getFirstReaction().playerId, response);
			}
			else {
				await defaultEndCallback(collector, response);
			}
		};
		const collector = new ChoiceReactionCollector(
			context,
			options,
			{
				end: endOverload
			}
		);
		ReactionCollector.register(collector);
		return collector;
	}
}