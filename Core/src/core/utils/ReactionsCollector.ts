import {RandomUtils} from "./RandomUtils";
import {
	ReactionCollector,
	ReactionCollectorCreationPacket,
	ReactionCollectorEnded,
	ReactionCollectorReaction,
	ReactionCollectorReactPacket
} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DraftBotPacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {BlockingUtils} from "./BlockingUtils";
import {sendPacketsToContext} from "../../../../Lib/src/packets/PacketUtils";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";
import {Error} from "sequelize";

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

	private readonly context: PacketContext;

	private readonly endCallback: EndCallback;

	private readonly reactionLimit: number;

	private _hasEnded: boolean;

	private reactionsHistory: ReactionInfo[] = [];

	private _creationPacket: ReactionCollectorCreationPacket;

	public constructor(reactionCollector: ReactionCollector, context: PacketContext, collectorOptions: CollectorOptions, endCallback: EndCallback, collectCallback: CollectCallback = null) {
		this.model = reactionCollector;
		this.filter = collectorOptions.allowedPlayerIds ? createDefaultFilter(collectorOptions.allowedPlayerIds) : (): boolean => true;
		this.time = collectorOptions.time;
		this.endTime = Date.now() + this.time;
		this.collectCallback = collectCallback;
		this.context = context;
		this.endCallback = endCallback;
		this.reactionLimit = collectorOptions.reactionLimit;
	}

	get hasEnded(): boolean {
		return this._hasEnded;
	}

	private set hasEnded(value: boolean) {
		this._hasEnded = value;
	}

	public async react(playerId: number, index: number, response: DraftBotPacket[]): Promise<void> {
		if (!this._creationPacket) {
			throw new Error("Reaction collector has not been built yet");
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
			sendPacketsToContext(this.context, response);
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

		this._creationPacket = this.model.creationPacket(this.id, this.endTime);
		return this.model.creationPacket(this.id, this.endTime);
	}

	public isValidReactionIndex(index: number): boolean {
		return index >= 0 && index < this._creationPacket.reactions.length;
	}

	get creationPacket(): ReactionCollectorCreationPacket {
		return this._creationPacket;
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