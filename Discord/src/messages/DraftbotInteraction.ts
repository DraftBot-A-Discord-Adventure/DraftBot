import {
	BaseGuildTextChannel,
	Client, CommandInteraction,
	GuildTextBasedChannel,
	InteractionEditReplyOptions,
	InteractionReplyOptions,
	Message,
	MessageCreateOptions,
	MessagePayload
} from "discord.js";
import {RawInteractionData, RawWebhookData} from "discord.js/typings/rawDataTypes";
import i18n from "../translations/i18n";
import {LANGUAGE, Language} from "../../../Lib/src/Language";

type DraftbotInteractionWithoutSendCommands = new(client: Client<true>, data: RawInteractionData) => Omit<CommandInteraction, "reply" | "followUp" | "channel">;
const DraftbotInteractionWithoutSendCommands: DraftbotInteractionWithoutSendCommands = CommandInteraction as unknown as DraftbotInteractionWithoutSendCommands;

type ChannelTypeWithoutSend = new(client: Client<true>, data: RawWebhookData) => Omit<BaseGuildTextChannel, "send">;
const GuildTextBasedChannel: GuildTextBasedChannel = BaseGuildTextChannel as unknown as GuildTextBasedChannel;
const ChannelTypeWithoutSend: ChannelTypeWithoutSend = GuildTextBasedChannel as unknown as ChannelTypeWithoutSend;

type OptionLike = string | InteractionReplyOptions;
type ReplyFunctionLike = (options: OptionLike) => Promise<Message>;

export class DraftbotInteraction extends DraftbotInteractionWithoutSendCommands {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	private _channel: DraftbotChannel;

	public userLanguage: Language = LANGUAGE.DEFAULT_LANGUAGE;

	private _replyEdited = false;

	/**
	 * Get the channel of the interaction
	 */
	get channel(): DraftbotChannel {
		return this._channel;
	}


	/**
	 * Cast a CommandInteraction to a DraftbotInteraction
	 * @param discordInteraction
	 */
	static cast(discordInteraction: CommandInteraction): DraftbotInteraction {
		discordInteraction.followUp = DraftbotInteraction.prototype.followUp.bind(discordInteraction);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		discordInteraction.reply = DraftbotInteraction.prototype.reply.bind(discordInteraction);
		discordInteraction.editReply = DraftbotInteraction.prototype.editReply.bind(discordInteraction);
		const interaction = discordInteraction as unknown as DraftbotInteraction;
		interaction._channel = DraftbotChannel.cast(discordInteraction.channel as GuildTextBasedChannel);
		return interaction;
	}

	/**
	 * Send a reply to the user
	 * @param options classic discord.js send options
	 * @param fallback function to execute if the bot can't send the message
	 */
	public async reply(options: OptionLike, fallback?: () => void | Promise<void>): Promise<Message> {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return await DraftbotInteraction.prototype.commonSendCommand(CommandInteraction.prototype.reply.bind(this), options, fallback ?? ((): null => null));
	}

	/**
	 * Send a followUp to the user
	 * @param options classic discord.js send options
	 * @param fallback function to execute if the bot can't send the message
	 */
	public async followUp(options: OptionLike, fallback?: () => void | Promise<void>): Promise<Message> {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return await DraftbotInteraction.prototype.commonSendCommand(CommandInteraction.prototype.followUp.bind(this), options, fallback ?? ((): null => null));
	}

	/**
	 * Send a message to the user
	 * @param functionPrototype reply or followUp function
	 * @param options classic discord.js send options
	 * @param fallback function to execute if the bot can't send the message
	 * @private
	 */
	private async commonSendCommand(functionPrototype: ReplyFunctionLike, options: OptionLike, fallback: () => void | Promise<void>): Promise<Message | null> {
		try {
			return await functionPrototype(options);
		}
		catch (e) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			console.error(`Weird Permission Error ${e.stack}`);
			await DraftbotInteraction.prototype.manageFallback.bind(this)(functionPrototype);
			await fallback();
			return null;
		}
	}

	/**
	 * Manage the fallback of both reply and followUp functions
	 * @private
	 */
	private async manageFallback(functionPrototype: ReplyFunctionLike): Promise<void> {
		const errorText = i18n.t("bot:noSpeakPermission", {lng: this.channel.language});
		try {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			await functionPrototype.call({
				ephemeral: true,
				content: errorText
			});
		}
		catch (e) {
			// We can't send ephemeral message, so we send the message in DM
			try {
				await CommandInteraction.prototype.user.send.bind(this.user)({content: errorText});
			}
			catch (e) {
				console.log(`Unable to alert user of no speak permission : c:${this.channel.id} / u:${this.user.id}`);
			}
		}
	}

	editReply = async (options: string | MessagePayload | InteractionEditReplyOptions): Promise<Message> => {
		this._replyEdited = true;
		return await CommandInteraction.prototype.editReply.bind(this)(options);
	};

	public get replyEdited(): boolean {
		return this._replyEdited;
	}
}

export class DraftbotChannel extends ChannelTypeWithoutSend {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	public language: Language;

	/**
	 * Cast a GuildTextBasedChannel to a DraftbotChannel
	 * @param channel
	 */
	static cast(channel: GuildTextBasedChannel): DraftbotChannel {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		channel.send = DraftbotChannel.prototype.send.bind(channel);
		return channel as unknown as DraftbotChannel;
	}

	/**
	 * Send a message to the channel
	 * @param options classic discord.js send options
	 * @param fallback function to execute if the bot can't send the message
	 */
	public async send(options: string | MessageCreateOptions, fallback?: () => void | Promise<void>): Promise<Message | null> {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		fallback = fallback ?? ((): null => null);
		try {
			return await BaseGuildTextChannel.prototype.send.bind(this)(options);
		}
		catch (e) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			console.error(`Weird Permission Error ${e.stack}`);
			DraftbotChannel.prototype.manageFallback.bind(this)();
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			await fallback();
			return null;
		}
	}

	/**
	 * Manage the fallback of the send function
	 * @private
	 */
	private manageFallback(): void {
		// We can't send ephemeral message nor send message in DM
		console.log(`Unable to alert user of no speak permission : c:${this.id} / u:N/A`);
	}
}