import {BaseMessageOptions, Message} from "discord.js";
import {DraftBotPacket, PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {minutesToMilliseconds} from "../../../Lib/src/utils/TimeUtils";
import {DiscordCache} from "../bot/DiscordCache";

export abstract class DraftbotCachedMessage<T extends DraftBotPacket = DraftBotPacket> {

	// Duration of the message's cached life in minutes
	abstract readonly duration: number;

	// The id of the original message
	readonly originalMessageId: string;

	// Message linked to this cached message
	storedMessage?: Message;

	protected constructor(originalMessageId: string) {
		this.originalMessageId = originalMessageId;
	}

	get cacheKey(): string {
		return `${this.originalMessageId}-${this.type}`;
	}

	// The type of the message, each interaction can store one cached message per type
	abstract get type(): string;

	// Function to call when you need to do something with the cached message
	abstract updateMessage(packet: T, context: PacketContext): Promise<void>;

	async update(packet: T, context: PacketContext): Promise<void> {
		await this.updateMessage(packet, context);
	}

	async post(options: BaseMessageOptions): Promise<Message | null> {
		if (this.storedMessage && this.storedMessage.editable) {
			return await this.storedMessage.edit(options);
		}
		const mainMessage = DiscordCache.getInteraction(this.originalMessageId);
		if (!mainMessage) {
			return null;
		}
		const message = await mainMessage.channel.send(options) as Message;
		this.storedMessage = message;
		return message;
	}
}

interface MessageLike<Message extends DraftbotCachedMessage> {
	type: string;

	new(originalMessageId: string): Message;
}

export class DraftbotCachedMessages {
	static cachedMessages: Map<string, DraftbotCachedMessage> = new Map<string, DraftbotCachedMessage>();

	static createCachedMessage(message: DraftbotCachedMessage): void {
		DraftbotCachedMessages.cachedMessages.set(message.cacheKey, message);
		setTimeout(() => {
			DraftbotCachedMessages.remove(message.cacheKey);
		}, minutesToMilliseconds(message.duration));
	}

	static remove(cacheKey: string): void {
		DraftbotCachedMessages.cachedMessages.delete(cacheKey);
	}

	static getOrCreate<Packet extends DraftBotPacket, Message extends DraftbotCachedMessage<Packet>>(originalMessageId: string, MessageLike: MessageLike<Message>): Message {
		const message = DraftbotCachedMessages.cachedMessages.get(`${originalMessageId}-${MessageLike.type}`);
		if (!message) {
			return new MessageLike(originalMessageId);
		}
		const instance = new MessageLike(message.originalMessageId);
		Object.assign(instance, message);
		return instance;
	}
}
