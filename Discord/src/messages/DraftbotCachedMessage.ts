import {Message} from "discord.js";
import {DraftBotPacket, PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {minutesToMilliseconds} from "../../../Lib/src/utils/TimeUtils";
import {DiscordCache} from "../bot/DiscordCache";
import {OptionLike} from "./DraftbotInteraction";


type CollectFunctionType = (packet: DraftBotPacket, context: PacketContext) => Promise<void>;

export abstract class DraftbotCachedMessage {
	// Function to call when you need to do something with the cached message
	abstract updateMessage: CollectFunctionType;

	// Duration of the message's cached life in minutes
	abstract duration: number;

	// Id of the original message
	readonly originalMessageId: string;

	// Message linked to this cached message
	storedMessage?: Message;

	constructor(originalMessageId: string) {
		this.originalMessageId = originalMessageId;
	}

	async update(packet: DraftBotPacket, context: PacketContext): Promise<void> {
		await this.updateMessage(packet, context);
	}

	async post(options: OptionLike): Promise<Message | null> {
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

// Je les mets ici pour le moment, mais faudra les déplacer
// Alors, je veux bien mais ou ???
export class DraftbotFightStatusCachedMessage extends DraftbotCachedMessage {
	updateMessage = async (packet: NomDuPacketFightStatus, context: PacketContext) => {
		// Actions à faire lors de la maj du message
	};

	duration = 30;
}

