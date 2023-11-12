import {
	Client,
	CommandInteraction,
	GuildChannel,
	GuildTextBasedChannel,
	InteractionReplyOptions,
	Message,
	MessageCreateOptions
} from "discord.js";
import {RawInteractionData, RawWebhookData} from "discord.js/typings/rawDataTypes";
import {Translations} from "../Translations";

type DraftbotInteractionWithoutSendCommands = new(client: Client<true>, data: RawInteractionData) => { [P in Exclude<Exclude<Exclude<keyof CommandInteraction, 'followUp'>, 'reply'>, 'channel'>]: CommandInteraction[P] }
const DraftbotInteractionWithoutSendCommands: DraftbotInteractionWithoutSendCommands = CommandInteraction as unknown as DraftbotInteractionWithoutSendCommands;

type ChannelTypeWithoutSend = new(client: Client<true>, data: RawWebhookData) => { [P in Exclude<keyof GuildTextBasedChannel, 'send'>]: GuildTextBasedChannel[P] }
const ChannelTypeWithoutSend: ChannelTypeWithoutSend = GuildChannel as unknown as ChannelTypeWithoutSend;

export class DraftbotInteraction extends DraftbotInteractionWithoutSendCommands {
	public channel: DraftbotChannel;

	public reply(options: string | InteractionReplyOptions, fallback?: () => void | Promise<void>): Promise<Message> {
		return this.commonSendCommand(DraftbotInteraction.prototype.reply, options, fallback ?? (() => null));
	}

	public followUp(options: string | InteractionReplyOptions, fallback?: () => void | Promise<void>): Promise<Message> {
		return this.commonSendCommand(DraftbotInteraction.prototype.followUp, options, fallback ?? (() => null));
	}

	private async commonSendCommand(functionPrototype: Function, options: string | InteractionReplyOptions, fallback: () => void | Promise<void>): Promise<Message> {
		try {
			return await functionPrototype.call(this, options);
		} catch (e) {
			console.error("Weird Permission Error" + e);
			await this.manageFallback(functionPrototype);
			await fallback();
			return null;
		}
	}

	private async manageFallback(functionPrototype: Function): Promise<void> {
		const errorText = Translations.getModule("bot", this.channel.language).get("noSpeakPermission");
		try {
			await functionPrototype.call(this, {
				ephemeral: true,
				content: errorText
			});
			return;
		} catch (e) {
			// We can't send ephemeral message, so we send the message in DM
			try {
				await DraftbotInteraction.prototype.user.send({content: errorText});
				return;
			} catch (e) {
				console.log(`Unable to alert user of no speak permission : ${CommandInteraction.prototype.user.id}`);
			}
		}
	}
}

export class DraftbotChannel extends ChannelTypeWithoutSend {
	public language: string;

	public send(options: string | MessageCreateOptions, fallback?: () => void | Promise<void>): Promise<Message> {
		return this.commonSendCommand(DraftbotInteraction.prototype.channel.send, options, fallback ?? (() => null));
	}

	private async commonSendCommand(functionPrototype: Function, options: string | MessageCreateOptions, fallback: () => void | Promise<void>): Promise<Message> {
		try {
			return await functionPrototype.call(this, options);
		} catch (e) {
			console.error("Weird Permission Error" + e);
			await this.manageFallback();
			await fallback();
			return null;
		}
	}

	private async manageFallback(): Promise<void> {
		// We can't send ephemeral message, so we send the message in DM
		try {
			await DraftbotInteraction.prototype.user.send({content: Translations.getModule("bot", this.language).get("noSpeakPermission")});
			return;
		} catch (e) {
			console.log(`Unable to alert user of no speak permission : ${CommandInteraction.prototype.user.id}`);
		}
	}
}