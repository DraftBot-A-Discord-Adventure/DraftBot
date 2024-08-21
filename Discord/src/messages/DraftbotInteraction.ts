import {
    BaseGuildTextChannel,
    Client,
    CommandInteraction,
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
import {CommandInteractionOptionResolver} from "discord.js/typings";

type DraftbotInteractionWithoutSendCommands = new(client: Client<true>, data: RawInteractionData) => Omit<CommandInteraction, "reply" | "followUp" | "channel">;
const DraftbotInteractionWithoutSendCommands: DraftbotInteractionWithoutSendCommands = CommandInteraction as unknown as DraftbotInteractionWithoutSendCommands;

type ChannelTypeWithoutSend = new(client: Client<true>, data: RawWebhookData) => Omit<BaseGuildTextChannel, "send">;
const GuildTextBasedChannel: GuildTextBasedChannel = BaseGuildTextChannel as unknown as GuildTextBasedChannel;
const ChannelTypeWithoutSend: ChannelTypeWithoutSend = GuildTextBasedChannel as unknown as ChannelTypeWithoutSend;

type ReplyOptionsSpecial = InteractionReplyOptions & { fetchReply: true };
type OptionLike = string | InteractionReplyOptions | ReplyOptionsSpecial;
type ReplyFunctionLike<OptionValue> = (options: OptionValue) => Promise<Message>;

export class DraftbotInteraction extends DraftbotInteractionWithoutSendCommands {
    public userLanguage: Language = LANGUAGE.DEFAULT_LANGUAGE;
    // @ts-expect-error - Property 'options' is initialized in the caster, which is the only normal way to create a DraftbotInteraction
    public options: CommandInteractionOptionResolver;

    // @ts-expect-error - Property '_channel' is initialized in the caster, which is the only normal way to create a DraftbotInteraction
    private _channel: DraftbotChannel;

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
    static cast(discordInteraction: CommandInteraction): DraftbotInteraction {
        discordInteraction.followUp = DraftbotInteraction.prototype.followUp.bind(discordInteraction);

        // @ts-expect-error - We aim at changing the signature of the reply function to add a fallback parameter, so ts is not happy with it
        discordInteraction.reply = DraftbotInteraction.prototype.reply.bind(discordInteraction);
        discordInteraction.editReply = DraftbotInteraction.prototype.editReply.bind(discordInteraction);
        const interaction = discordInteraction as unknown as DraftbotInteraction;
        interaction._channel = DraftbotChannel.cast(discordInteraction.channel as GuildTextBasedChannel);
        interaction.options = this.properCastOptions(discordInteraction.options as CommandInteractionOptionResolver);

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
        // not present in class AutoCompleteInteraction | MessageContextMenuInteraction
        options.getUser ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getUser is not defined for this interaction, probably trying to use it on either an autocomplete or a message context menu")
        });

        // not present in class AutoCompleteInteraction
        options.getMember ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getMember is not defined for this interaction, probably trying to use it on an autocomplete")
        });

        // not present in class ChatInputCommandInteraction | AutocompleteInteraction | UserContextMenuCommandInteraction
        options.getMessage ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getMessage is not defined for this interaction, probably trying to use it on either a chat input, an autocomplete or a user context menu")
        });

        // not present in class ChatInputCommandInteraction | MessageContextMenuInteraction | UserContextMenuCommandInteraction
        options.getFocused ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getFocused is not defined for this interaction, probably trying to use it on either a chat input, a message context menu or a user context menu")
        });

        // not present in AutoCompleteInteraction | UserContextMenuCommandInteraction
        options.getChannel ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getChannel is not defined for this interaction, probably trying to use it on either an autocomplete or a user context menu")
        });

        // not present in class AutoCompleteInteraction | MessageContextMenuInteraction | UserContextMenuCommandInteraction
        options.getAttachment ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getAttachment is not defined for this interaction, probably trying to use it on either an autocomplete, a message context menu or a user context menu")
        });
        options.getMentionable ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getMentionable is not defined for this interaction, probably trying to use it on either an autocomplete, a message context menu or a user context menu")
        });
        options.getRole ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getRole is not defined for this interaction, probably trying to use it on either an autocomplete, a message context menu or a user context menu")
        });

        // not present in class MessageContextMenuInteraction | UserContextMenuCommandInteraction
        options.getNumber ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getNumber is not defined for this interaction, probably trying to use it on either a message context menu or a user context menu")
        });
        options.getInteger ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getInteger is not defined for this interaction, probably trying to use it on either a message context menu or a user context menu")
        });
        options.getString ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getString is not defined for this interaction, probably trying to use it on either a message context menu or a user context menu")
        });
        options.getBoolean ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getBoolean is not defined for this interaction, probably trying to use it on either a message context menu or a user context menu")
        });
        options.getSubcommandGroup ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getSubcommandGroup is not defined for this interaction, probably trying to use it on either a message context menu or a user context menu")
        });
        options.getSubcommand ??= (() => {
            throw new Error("DraftbotInteraction: interaction.options.getSubcommand is not defined for this interaction, probably trying to use it on either a message context menu or a user context menu")
        });

        return options
    }

    /**
     * Send a reply to the user
     * @param options classic discord.js send options
     * @param fallback function to execute if the bot can't send the message
     */
    public async reply(options: OptionLike, fallback?: () => void | Promise<void>): Promise<Message> {
        return await DraftbotInteraction.prototype.commonSendCommand(CommandInteraction.prototype.reply.bind(this), options as ReplyOptionsSpecial, fallback ?? (() => {
        })) as Message;
    }

    /**
     * Send a followUp to the user
     * @param options classic discord.js send options
     * @param fallback function to execute if the bot can't send the message
     */
    public async followUp(options: OptionLike, fallback?: () => void | Promise<void>): Promise<Message> {
        return await DraftbotInteraction.prototype.commonSendCommand(CommandInteraction.prototype.followUp.bind(this), options, fallback ?? (() => {
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
    private async commonSendCommand<OptionType extends OptionLike>(functionPrototype: ReplyFunctionLike<OptionType>, options: OptionType, fallback: () => void | Promise<void>): Promise<Message | null> {
        try {
            return await functionPrototype(options);
        } catch (e) {
            console.error(`Weird Permission Error ${(e as Error).stack}`);
            await DraftbotInteraction.prototype.manageFallback.bind(this)(functionPrototype);
            await fallback();
            return null;
        }
    }

    /**
     * Manage the fallback of both reply and followUp functions
     * @private
     */
    private async manageFallback<OptionType extends OptionLike>(functionPrototype: ReplyFunctionLike<OptionType>): Promise<void> {
        const errorText = i18n.t("bot:noSpeakPermission", {lng: this.channel.language});
        try {
            // @ts-expect-error - We consider that the functionPrototype is a function that can be called with these parameters (i.e, accepts a InteractionReplyOptions)
            await functionPrototype.call(this, {
                ephemeral: true,
                content: errorText
            });
        } catch (e) {
            // We can't send ephemeral message, so we send the message in DM
            try {
                await CommandInteraction.prototype.user.send.bind(this.user)({content: errorText});
            } catch (e) {
                console.log(`Unable to alert user of no speak permission : c:${this.channel.id} / u:${this.user.id}`);
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
        fallback ??= (() => {
        });
        try {
            return await BaseGuildTextChannel.prototype.send.bind(this)(options);
        } catch (e) {
            console.error(`Weird Permission Error ${(e as Error).stack}`);
            DraftbotChannel.prototype.manageFallback.bind(this)();
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