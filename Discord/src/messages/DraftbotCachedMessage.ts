import {Message, MessageCreateOptions, MessageEditOptions, MessagePayload} from "discord.js";
import {DraftBotPacket, PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {minutesToMilliseconds} from "../../../Lib/src/utils/TimeUtils";
import {DiscordCache} from "../bot/DiscordCache";
import {OptionLike} from "./DraftbotInteraction";

export abstract class DraftbotCachedMessage<T extends DraftBotPacket = DraftBotPacket> {
	// Function to call when you need to do something with the cached message
	abstract updateMessage(packet: T, context: PacketContext): Promise<void>;

	// Duration of the message's cached life in minutes
	abstract duration: number;

	// The id of the original message
	readonly originalMessageId: string;

	// The type of the message, each interaction can store one cached message per type
	readonly type: string;

	// Message linked to this cached message
	storedMessage?: Message;

	get cacheKey(): string {
		return `${this.originalMessageId}-${this.type}`;
	}

	protected constructor(originalMessageId: string, type: string) {
		this.originalMessageId = originalMessageId;
		this.type = type;
	}

	async update(packet: T, context: PacketContext): Promise<void> {
		await this.updateMessage(packet, context);
	}

	async post(options: OptionLike): Promise<Message | null> {
		if (this.storedMessage && this.storedMessage.editable) {
			return await this.storedMessage.edit(options as string | MessageEditOptions | MessagePayload); // Todo: Check with romain for maybe better solution than casting here
		}
		const mainMessage = DiscordCache.getInteraction(this.originalMessageId);
		if (!mainMessage) {
			return null;
		}
		const message = await mainMessage.channel.send(options as string | MessageCreateOptions) as Message; // Todo: Check with romain for maybe better solution than casting here
		this.storedMessage = message;
		return message;
	}
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

	static get(cacheKey: string): DraftbotCachedMessage | undefined {
		return DraftbotCachedMessages.cachedMessages.get(cacheKey);
	}
}
