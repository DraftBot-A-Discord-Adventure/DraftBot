import {
	BaseMessageOptions, Message
} from "discord.js";
import {
	DraftBotPacket, PacketContext
} from "../../../Lib/src/packets/DraftBotPacket";
import { minutesToMilliseconds } from "../../../Lib/src/utils/TimeUtils";
import { DiscordCache } from "../bot/DiscordCache";
import { ReactionCollectorReturnTypeOrNull } from "../packetHandlers/handlers/ReactionCollectorHandlers";

export abstract class DraftbotCachedMessage<T extends DraftBotPacket = DraftBotPacket> {
	// Duration of the message's cached life in minutes
	abstract readonly duration: number;

	// The id of the original message
	readonly originalMessageId: string;

	// Message linked to this cached message
	storedMessage?: Message;

	// Toggleable variable to know if we should reupload the message
	reuploadMessage = false;

	constructor(originalMessageId: string) {
		this.originalMessageId = originalMessageId;
	}

	get cacheKey(): string {
		return `${this.originalMessageId}-${this.type}`;
	}

	// The type of the message, each interaction can store one cached message per type
	abstract get type(): string;

	// Function to call when you need to do something with the cached message
	abstract updateMessage(packet: T, context: PacketContext): Promise<ReactionCollectorReturnTypeOrNull>;

	async update(packet: T, context: PacketContext): Promise<ReactionCollectorReturnTypeOrNull> {
		return await this.updateMessage(packet, context);
	}

	async post(options: BaseMessageOptions): Promise<Message | null> {
		if (this.reuploadMessage) {
			this.storedMessage?.delete();
			this.storedMessage = undefined;
			this.reuploadMessage = false;
		}
		if (this.storedMessage) {
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

	async delete(): Promise<void> {
		if (this.storedMessage) {
			await this.storedMessage.delete();
		}
		this.storedMessage = undefined;
	}
}

type MessageLike<Message extends DraftbotCachedMessage> = new (originalMessageId: string) => Message;

export class DraftbotCachedMessages {
	static cachedMessages: Map<string, DraftbotCachedMessage> = new Map<string, DraftbotCachedMessage>();

	static createCachedMessage(message: DraftbotCachedMessage): void {
		DraftbotCachedMessages.cachedMessages.set(message.cacheKey, message);
		setTimeout(() => {
			DraftbotCachedMessages.remove(message.cacheKey);
		}, minutesToMilliseconds(message.duration));
	}

	/**
	 * Remove a cached message from its key
	 * @param cacheKey
	 */
	static remove(cacheKey: string): void {
		DraftbotCachedMessages.cachedMessages.delete(cacheKey);
	}

	/**
	 * Remove all cached messages from a message id
	 * @param originalMessageId
	 * @param removeCallback
	 */
	static removeAllFromMessageId(originalMessageId: string, removeCallback: (cachedMessage: DraftbotCachedMessage) => void): void {
		DraftbotCachedMessages.cachedMessages.forEach((message, key) => {
			if (key.startsWith(originalMessageId)) {
				DraftbotCachedMessages.remove(key);
				removeCallback(message);
			}
		});
	}

	static getOrCreate<Packet extends DraftBotPacket, Message extends DraftbotCachedMessage<Packet>>(originalMessageId: string, MessageLike: MessageLike<Message>): Message {
		const type = new MessageLike("").type;
		const message = DraftbotCachedMessages.cachedMessages.get(`${originalMessageId}-${type}`);
		if (!message) {
			const newMessage = new MessageLike(originalMessageId);
			DraftbotCachedMessages.createCachedMessage(newMessage);
			return newMessage;
		}
		return message as Message;
	}

	static markAsReupload(message: DraftbotCachedMessage): void {
		DraftbotCachedMessages.cachedMessages.get(message.cacheKey)!.reuploadMessage = true;
	}
}
