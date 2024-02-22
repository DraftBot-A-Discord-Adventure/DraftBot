import {RandomUtils} from "./RandomUtils";
import {
	ReactionCollector,
	ReactionCollectorCreationPacket,
	ReactionCollectorEnded,
	ReactionCollectorReaction,
	ReactionCollectorReactPacket
} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {BlockingUtils} from "./BlockingUtils";
import {sendPacketsToContext} from "../../../../Lib/src/packets/PacketUtils";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";
import {Constants} from "../Constants";

type CollectCallback = (collector: ReactionCollectorInstance, reaction: ReactionCollectorReaction, playerId: number, response: DraftBotPacket[]) => void | Promise<void>;

export type EndCallback = (collector: ReactionCollectorInstance, response: DraftBotPacket[]) => void | Promise<void>;

type FilterFunction = (collector: ReactionCollectorInstance, playerId: number, reactionIndex: number) => boolean | Promise<boolean>;

export type CollectorOptions = {
	time?: number;
	allowedPlayerIds?: number[];
	reactionLimit?: number;
};

type ReactionInfo = {
	playerId: number,
	reaction: ReactionCollectorReaction
};

export function createDefaultFilter(allowedPlayerIds: number[]): FilterFunction {
	return (collector, playerId, reactionIndex) => allowedPlayerIds.includes(playerId) && collector.isValidReactionIndex(reactionIndex);
}

const collectors: Map<string, ReactionCollectorInstance> = new Map<string, ReactionCollectorInstance>();

export class ReactionCollectorInstance {
	private id: string;

	private model: ReactionCollector;

	private readonly filter: FilterFunction;

	private readonly endTime: number;

	private readonly time: number;

	private readonly collectCallback: CollectCallback;

	private readonly _context: PacketContext;

	private readonly endCallback: EndCallback;

	private readonly reactionLimit: number;

	private _hasEnded: boolean;

	private reactionsHistory: ReactionInfo[] = [];

	private _creationPacket: ReactionCollectorCreationPacket;

	public constructor(reactionCollector: ReactionCollector, context: PacketContext, collectorOptions: CollectorOptions, endCallback: EndCallback, collectCallback: CollectCallback = null) {
		this.model = reactionCollector;
		this.filter = collectorOptions.allowedPlayerIds ? createDefaultFilter(collectorOptions.allowedPlayerIds) : (): boolean => true;
		this.time = collectorOptions.time ?? Constants.MESSAGES.COLLECTOR_TIME;
		this.endTime = Date.now() + this.time;
		this.collectCallback = collectCallback;
		this._context = context;
		this.endCallback = endCallback;
		this.reactionLimit = collectorOptions.reactionLimit ?? 1;
	}

	get hasEnded(): boolean {
		return this._hasEnded;
	}

	private set hasEnded(value: boolean) {
		this._hasEnded = value;
	}

	public async react(playerId: number, index: number, response: DraftBotPacket[]): Promise<void> {
		if (!this._creationPacket) {
			throw "Reaction collector has not been built yet";
		}

		const reaction = this._creationPacket.reactions[index];
		if (!await this.filter(this, playerId, index)) {
			return;
		}
		this.reactionsHistory.push({
			playerId,
			reaction
		});
		if (this.collectCallback) {
			await this.collectCallback(this, reaction, playerId, response);
		}
		if (this.reactionsHistory.length >= this.reactionLimit && this.reactionLimit > 0) {
			await this.end();
		}
	}

	public async end(): Promise<void> {
		if (this.hasEnded) {
			return;
		}
		this.hasEnded = true;
		collectors.delete(this.id);
		if (this.endCallback) {
			const response: DraftBotPacket[] = [];
			await this.endCallback(this, response);
			sendPacketsToContext(this._context, response);
		}
	}

	public block(playerId: number, reason: string): this {
		BlockingUtils.blockPlayerUntil(playerId, reason, this.endTime);
		return this;
	}

	public getReactionsHistory(): ReactionInfo[] {
		return this.reactionsHistory;
	}

	public getFirstReaction(): ReactionInfo | null {
		return this.reactionsHistory.length !== 0 ? this.reactionsHistory[0] : null;
	}

	public build(): ReactionCollectorCreationPacket {
		if (this._creationPacket) {
			throw "Reaction collector has already been built";
		}

		// Register
		const id = RandomUtils.draftbotRandom.uuid4();
		collectors.set(id, this);
		setTimeout(this.endCallback, this.endTime - Date.now());

		this._creationPacket = makePacket(ReactionCollectorCreationPacket, this.model.creationPacket(this.id, this.endTime));
		return this._creationPacket;
	}

	public isValidReactionIndex(index: number): boolean {
		return index >= 0 && index < this._creationPacket.reactions.length;
	}

	get creationPacket(): ReactionCollectorCreationPacket {
		return this._creationPacket;
	}

	get context(): PacketContext {
		return this._context;
	}
}

export class ReactionCollectorController {
	public static async reactPacket(_client: WebsocketClient, packet: ReactionCollectorReactPacket, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const collector: ReactionCollectorInstance = collectors.get(packet.id);
		if (!collector || collector.hasEnded) {
			const packet: ReactionCollectorEnded = {};
			response.push(packet);
		}
		else {
			await collector.react(packet.playerId, packet.reactionIndex, response);
		}
	}
}