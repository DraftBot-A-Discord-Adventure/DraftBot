import {Message, MessageCreateOptions, MessageEditOptions, MessagePayload} from "discord.js";
import {DraftBotPacket, PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {minutesToMilliseconds} from "../../../Lib/src/utils/TimeUtils";
import {DiscordCache} from "../bot/DiscordCache";
import {OptionLike} from "./DraftbotInteraction";


type UpdateFunctionType = (packet: DraftBotPacket, context: PacketContext) => Promise<void>;

export abstract class DraftbotCachedMessage {
	// Function to call when you need to do something with the cached message
	abstract updateMessage: UpdateFunctionType;

	// Duration of the message's cached life in minutes
	abstract duration: number;

	// The id of the original message
	readonly originalMessageId: string;

	// Message linked to this cached message
	storedMessage?: Message;

	protected constructor(originalMessageId: string) {
		this.originalMessageId = originalMessageId;
	}

	async update(packet: DraftBotPacket, context: PacketContext): Promise<void> {
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
		DraftbotCachedMessages.cachedMessages.set(message.originalMessageId, message);
		setTimeout(() => {
			DraftbotCachedMessages.remove(message.originalMessageId);
		}, minutesToMilliseconds(message.duration));
	}

	static remove(messageId: string): void {
		DraftbotCachedMessages.cachedMessages.delete(messageId);
	}

	static get(messageId: string): DraftbotCachedMessage | undefined {
		return DraftbotCachedMessages.cachedMessages.get(messageId);
	}
}
