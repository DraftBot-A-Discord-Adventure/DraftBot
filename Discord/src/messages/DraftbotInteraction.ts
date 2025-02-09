import {
	BaseGuildTextChannel,
	ButtonInteraction,
	Client,
	CommandInteraction, DiscordjsError, DiscordjsErrorCodes,
	GuildTextBasedChannel,
	InteractionEditReplyOptions,
	InteractionReplyOptions,
	Message,
	MessageCreateOptions,
	MessagePayload, StringSelectMenuInteraction
} from "discord.js";
import {RawInteractionData, RawWebhookData} from "discord.js/typings/rawDataTypes";
import i18n from "../translations/i18n";
import {LANGUAGE, Language} from "../../../Lib/src/Language";
import {CommandInteractionOptionResolver} from "discord.js/typings";
import {DraftBotEmbed} from "./DraftBotEmbed";

type DraftbotInteractionWithoutSendCommands = new(client: Client<true>, data: RawInteractionData) => Omit<CommandInteraction, "reply" | "followUp" | "channel">;
const DraftbotInteractionWithoutSendCommands: DraftbotInteractionWithoutSendCommands = CommandInteraction as unknown as DraftbotInteractionWithoutSendCommands;

type ChannelTypeWithoutSend = new(client: Client<true>, data: RawWebhookData) => Omit<BaseGuildTextChannel, "send">;
const GuildTextBasedChannel: GuildTextBasedChannel = BaseGuildTextChannel as unknown as GuildTextBasedChannel;
const ChannelTypeWithoutSend: ChannelTypeWithoutSend = GuildTextBasedChannel as unknown as ChannelTypeWithoutSend;

type ReplyOptionsSpecial = InteractionReplyOptions & { fetchReply: true };
export type OptionLike = string | InteractionReplyOptions | ReplyOptionsSpecial;
type ReplyFunctionLike<OptionValue> = (options: OptionValue) => Promise<Message>;

export class DraftbotInteraction extends DraftbotInteractionWithoutSendCommands {
	public userLanguage: Language = LANGUAGE.DEFAULT_LANGUAGE;

	public options!: CommandInteractionOptionResolver;

	private _channel!: DraftbotChannel;

	/**
	 * Get the channel of the interaction
	 */
	get channel(): DraftbotChannel {
		return this._channel;
	}

	private _replyEdited = false;

	public get replyEdited(): boolean {
		return this._replyEdited;
	}

	/**
	 * Cast a CommandInteraction to a DraftbotInteraction
	 * @param discordInteraction
	 */
	static cast(discordInteraction: CommandInteraction | ButtonInteraction | StringSelectMenuInteraction): DraftbotInteraction {
		if (discordInteraction === null) {
			throw new Error("DraftbotInteraction casting: discordInteraction is null.");
		}
		discordInteraction.followUp = DraftbotInteraction.prototype.followUp.bind(discordInteraction);

		// @ts-expect-error - We aim at changing the signature of the reply function to add a fallback parameter, so ts is not happy with it
		discordInteraction.reply = DraftbotInteraction.prototype.reply.bind(discordInteraction);
		discordInteraction.editReply = DraftbotInteraction.prototype.editReply.bind(discordInteraction);
		const interaction = discordInteraction as unknown as DraftbotInteraction;
		interaction._channel = DraftbotChannel.cast(discordInteraction.channel as GuildTextBasedChannel);
		if (Object.prototype.hasOwnProperty.call(discordInteraction, "options")) {
			interaction.options = this.properCastOptions((discordInteraction as CommandInteraction).options as CommandInteractionOptionResolver);
		}
		return interaction;
	}

	/**
	 * Properly cast the options of the interaction to add missing functions and throw explicit errors when trying to use unavailable functions
	 *
	 * LAST DISCORD.JS UPDATE CHECKED: 14.15.3
	 * @param options
	 * @private
	 */

	private static properCastOptions(options: CommandInteractionOptionResolver): CommandInteractionOptionResolver {
		// Not present in class AutoCompleteInteraction | MessageContextMenuInteraction
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getUser ??= () => {
			throw new Error("DraftbotInteraction: interaction.options.getUser is not defined for this interaction.");
		};

		// Not present in class AutoCompleteInteraction
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getMember ??= () => {
			throw new Error("DraftbotInteraction: interaction.options.getMember is not defined for this interaction.");
		};

		// Not present in class ChatInputCommandInteraction | AutocompleteInteraction | UserContextMenuCommandInteraction
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getMessage ??= () => {
			throw new Error("DraftbotInteraction: interaction.options.getMessage is not defined for this interaction.");
		};

		// Not present in class ChatInputCommandInteraction | MessageContextMenuInteraction | UserContextMenuCommandInteraction
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getFocused ??= () => {
			throw new Error("DraftbotInteraction: interaction.options.getFocused is not defined for this interaction.");
		};

		// Not present in AutoCompleteInteraction | UserContextMenuCommandInteraction
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getChannel ??= () => {
			throw new Error(
				"DraftbotInteraction: interaction.options.getChannel is not defined for this interaction."
			);
		};

		// Not present in class AutoCompleteInteraction | MessageContextMenuInteraction | UserContextMenuCommandInteraction
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getAttachment ??= () => {
			throw new Error(
				"DraftbotInteraction: interaction.options.getAttachment is not defined for this interaction."
			);
		};

		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getMentionable ??= () => {
			throw new Error(
				"DraftbotInteraction: interaction.options.getMentionable is not defined for this interaction."
			);
		};

		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getRole ??= () => {
			throw new Error(
				"DraftbotInteraction: interaction.options.getRole is not defined for this interaction."
			);
		};

		// Not present in class MessageContextMenuInteraction | UserContextMenuCommandInteraction
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getNumber ??= () => {
			throw new Error(
				"DraftbotInteraction: interaction.options.getNumber is not defined for this interaction."
			);
		};

		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getInteger ??= () => {
			throw new Error(
				"DraftbotInteraction: interaction.options.getInteger is not defined for this interaction."
			);
		};

		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getString ??= () => {
			throw new Error(
				"DraftbotInteraction: interaction.options.getString is not defined for this interaction."
			);
		};

		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getBoolean ??= () => {
			throw new Error(
				"DraftbotInteraction: interaction.options.getBoolean is not defined for this interaction."
			);
		};

		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getSubcommandGroup ??= () => {
			throw new Error(
				"DraftbotInteraction: interaction.options.getSubcommandGroup is not defined for this interaction."
			);
		};

		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		options.getSubcommand ??= () => {
			throw new Error(
				"DraftbotInteraction: interaction.options.getSubcommand is not defined for this interaction."
			);
		};

		return options;
	}

	/**
	 * Send a reply to the user
	 * @param options classic discord.js send options
	 * @param fallback function to execute if the bot can't send the message
	 */
	public async reply(options: OptionLike, fallback?: () => void | Promise<void>): Promise<Message> {
		// @ts-expect-error - We consider that the following function passed as argument has the correct typing
		return await DraftbotInteraction.prototype.commonSendCommand.call(this, CommandInteraction.prototype.reply.bind(this), options, fallback ?? ((): void => {
			// Do nothing by default if no fallback is provided
		})) as Message;
	}

	/**
	 * Send a followUp to the user
	 * @param options classic discord.js send options
	 * @param fallback function to execute if the bot can't send the message
	 */
	public async followUp(options: OptionLike, fallback?: () => void | Promise<void>): Promise<Message> {
		return await DraftbotInteraction.prototype.commonSendCommand.call(this, CommandInteraction.prototype.followUp.bind(this), options, fallback ?? ((): void => {
			// Do nothing by default if no fallback is provided
		})) as Message;
	}

	editReply = async (options: string | MessagePayload | InteractionEditReplyOptions): Promise<Message> => {
		this._replyEdited = true;
		return await CommandInteraction.prototype.editReply.bind(this)(options);
	};

	/**
	 * Send a message to the user
	 * @param functionPrototype reply or followUp function
	 * @param options classic discord.js send options
	 * @param fallback function to execute if the bot can't send the message
	 * @private
	 */
	private async commonSendCommand<OptionType extends OptionLike>(functionPrototype: ReplyFunctionLike<OptionType>, options: OptionType, fallback: () => void | Promise<void>)
		: Promise<Message | null> {
		try {
			return await functionPrototype(options);
		}
		catch (e) {
			console.error(`An error occured during a send, either a permission issue or a send/reply/followUp/editReply conflict : ${(e as Error).stack}`);
			await DraftbotInteraction.prototype.manageFallback.bind(this)(functionPrototype, e as Error);
			await fallback();
			return null;
		}
	}

	/**
	 * Manage the fallback of both reply and followUp functions
	 * @private
	 */
	private async manageFallback<OptionType extends OptionLike>(functionPrototype: ReplyFunctionLike<OptionType>, e: Error): Promise<void> {
		// Error codes due to a development mistake, and not because of a weird permission error
		const manageFallbackDevErrorCodes = [
			DiscordjsErrorCodes.InteractionAlreadyReplied,
			DiscordjsErrorCodes.InteractionNotReplied
		];

		let toSendProp: { content?: string, embeds?: DraftBotEmbed[] };
		if (e?.constructor.name === DiscordjsError.name && manageFallbackDevErrorCodes.includes((e as DiscordjsError).code)) {
			toSendProp = {
				embeds: [new DraftBotEmbed()
					.formatAuthor(i18n.t("error:errorOccurredTitle", {lng: this.userLanguage}), this.user)
					.setDescription(i18n.t("error:aDevMessedUp", {lng: this.userLanguage}))
					.setErrorColor()]
			};
		}
		else {
			toSendProp = { content: i18n.t("bot:noSpeakPermission", {lng: this.userLanguage}) };
		}
		try {
			// @ts-expect-error - We consider that the functionPrototype is a function that can be called with these parameters (i.e, accepts a InteractionReplyOptions)
			await functionPrototype.call(this, {
				ephemeral: true,
				...toSendProp
			});
		}
		catch {
			if (functionPrototype !== DraftbotChannel.prototype.send) {
				// Try again to manage fallback with the send function
				// @ts-expect-error - We consider that the functionPrototype is a function that can be called with these parameters (i.e, accepts a InteractionReplyOptions)
				await DraftbotInteraction.prototype.manageFallback.bind(this)(BaseGuildTextChannel.prototype.send.bind(this.channel), e);
				return;
			}
			// We can't send ephemeral message, so we send the message in DM
			try {
				await CommandInteraction.prototype.user.send.bind(this.user)({...toSendProp});
			}
			catch {
				console.log(`Unable to alert user of no speak permission : c:${this.channel?.id} / u:${this.user?.id}`);
			}
		}
	}
}

export class DraftbotChannel extends ChannelTypeWithoutSend {
	// @ts-expect-error - Property 'language' starts undefined and is initialized if we are sure the channel is a valid channel
	public language: Language;

	/**
	 * Cast a GuildTextBasedChannel to a DraftbotChannel
	 * @param channel
	 */
	static cast(channel: GuildTextBasedChannel): DraftbotChannel {
		// @ts-expect-error - We aim at changing the signature of the send function to add a fallback parameter, so ts is not happy with it
		channel.send = DraftbotChannel.prototype.send.bind(channel);
		return channel as unknown as DraftbotChannel;
	}

	/**
	 * Send a message to the channel
	 * @param options classic discord.js send options
	 * @param fallback function to execute if the bot can't send the message
	 */
	public async send(options: string | MessageCreateOptions, fallback?: () => void | Promise<void>): Promise<Message | null> {
		try {
			return await BaseGuildTextChannel.prototype.send.bind(this)(options);
		}
		catch (e) {
			console.error(`Weird Permission Error ${(e as Error).stack}`);
			DraftbotChannel.prototype.manageFallback.bind(this)();
			fallback ??= (): void => {
				// Do nothing by default if no fallback is provided
			};
			await fallback();
			return null;
		}
	}

	/**
	 * Manage the fallback of the send function
	 * @private
	 */
	private manageFallback(): void {
		// We can't send ephemeral message nor send messages in DM
		console.log(`Unable to alert user of no speak permission : c:${this.id} / u:N/A`);
	}
}