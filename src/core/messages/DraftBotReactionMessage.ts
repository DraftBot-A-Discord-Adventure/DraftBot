import {
	CommandInteraction,
	DMChannel,
	Message,
	MessageReaction,
	NewsChannel,
	ReactionCollector,
	TextBasedChannel,
	TextChannel,
	User
} from "discord.js";
import {DraftBotReaction} from "./DraftBotReaction";
import {Constants} from "../Constants";
import {DraftBotEmbed} from "./DraftBotEmbed";
import {draftBotClient} from "../bot";

/**
 * Error thrown if the message has not been sent before
 */
const MESSAGE_NOT_SENT_ERROR = "Message has not been sent";

/**
 * A class corresponding to a reaction message used in the bot
 */
export class DraftBotReactionMessage extends DraftBotEmbed {
	/**
	 * The list of reactions of the message
	 */
	private readonly _reactions: DraftBotReaction[];

	/**
	 * The ids used to filter the allowed reactions
	 * The ids are not checked if {@link _anyUserAllowed} is true
	 */
	private readonly _allowedUsersDiscordIdToReact: string[];

	/**
	 * A list used to retrieve the reactions quickly from name
	 */
	private _reactionsNames: string[];

	/**
	 * The callback called when the collector ends. Can be null or undefined
	 */
	private readonly _endCallback: (msg: DraftBotReactionMessage) => void;

	/**
	 * The max number of reactions the collector allows
	 */
	private readonly _maxReactions: number;

	/**
	 * A variable defining is any user can react to the message
	 */
	private readonly _anyUserAllowed: boolean;

	/**
	 * A variable which indicates the time of the collector
	 */
	private readonly _collectorTime: number;

	/**
	 * Default constructor
	 * @param reactions
	 * @param allowedUsersDiscordIdToReact
	 * @param endCallback
	 * @param maxReactions
	 * @param anyUserAllowed
	 * @param collectorTime
	 */
	constructor(
		reactions: DraftBotReaction[],
		allowedUsersDiscordIdToReact: string[],
		endCallback: (msg: DraftBotReactionMessage) => (Promise<void> | void),
		maxReactions: number,
		anyUserAllowed: boolean,
		collectorTime: number) {
		super();
		this._reactions = reactions;
		this._allowedUsersDiscordIdToReact = allowedUsersDiscordIdToReact;
		this._endCallback = endCallback as (msg: DraftBotReactionMessage) => void;
		this._maxReactions = maxReactions;
		this._anyUserAllowed = anyUserAllowed;
		this._collectorTime = collectorTime;
		this._reactionsNames = [];
		for (const reaction of reactions) {
			this._reactionsNames.push(reaction.emote);
		}
	}

	/**
	 * The collector of the message
	 */
	private _collector: ReactionCollector = undefined;

	/**
	 * Returns the message collector
	 */
	get collector(): ReactionCollector {
		return this._collector;
	}

	/**
	 * The message sent
	 * @private
	 */
	private _sentMessage: Message;

	/**
	 * Returns the sent message
	 */
	get sentMessage(): Message {
		return this._sentMessage;
	}

	/**
	 * Reply to a command interaction
	 * @param interaction
	 * @param collectorCallback
	 */
	async reply(interaction: CommandInteraction, collectorCallback: (collector: ReactionCollector) => void = null): Promise<Message> {
		this._sentMessage = await interaction.reply({embeds: [this], fetchReply: true}) as Message;
		await this.collectAndReact(collectorCallback);
		return this._sentMessage;
	}

	async editReply(interaction: CommandInteraction, collectorCallback: (collector: ReactionCollector) => void = null): Promise<Message> {
		this._sentMessage = await interaction.editReply({embeds: [this]}) as Message;
		await this.collectAndReact(collectorCallback);
		return this._sentMessage;
	}

	/**
	 * Send the message to a channel
	 * @param channel
	 * @param collectorCallback The callback called when the collector is initialized. Often used to block the player
	 */
	async send(channel: TextChannel | DMChannel | NewsChannel | TextBasedChannel, collectorCallback: (collector: ReactionCollector) => void = null): Promise<Message> {
		this._sentMessage = await channel.send({embeds: [this]});
		await this.collectAndReact(collectorCallback);
		return this._sentMessage;
	}

	/**
	 * Stop the collector of the message
	 */
	stop(): void {
		if (!this._collector) {
			throw MESSAGE_NOT_SENT_ERROR;
		}
		this._collector.stop();
	}

	/**
	 * Get the first reaction of the message
	 * Can be undefined or null if there is no reaction
	 */
	getFirstReaction(): MessageReaction {
		if (!this._collector) {
			throw MESSAGE_NOT_SENT_ERROR;
		}
		return this._collector.collected.first();
	}

	/**
	 * Create the collector, add the reactions etc...
	 * @param collectorCallback
	 * @private
	 */
	private async collectAndReact(collectorCallback: (collector: ReactionCollector) => void = null) {
		const collectorFilter = (reaction: MessageReaction, user: User) =>
			!user.bot &&
			(this._anyUserAllowed || this._allowedUsersDiscordIdToReact.indexOf(user.id) !== -1)
			&& (this._reactionsNames.indexOf(reaction.emoji.name) !== -1 || this._reactionsNames.indexOf(reaction.emoji.id) !== -1);
		this._collector = this._sentMessage.createReactionCollector({
			filter: collectorFilter,
			time: this._collectorTime <= 0 ? Constants.MESSAGES.COLLECTOR_TIME : this._collectorTime,
			max: this._maxReactions,
			dispose: true
		});
		if (collectorCallback) {
			collectorCallback(this._collector);
		}
		this._collector.on("collect", (reaction, user) => {
			const reactionName = this._reactionsNames.indexOf(reaction.emoji.id) !== -1 ? reaction.emoji.id : reaction.emoji.name;
			const callback = this._reactions[this._reactionsNames.indexOf(reactionName)].callback;
			if (!callback) {
				this._collector.stop();
			}
			else {
				callback(this, reaction, user);
			}
		});
		this._collector.on("remove", (reaction, user) => {
			const reactionName = this._reactionsNames.indexOf(reaction.emoji.id) !== -1 ? reaction.emoji.id : reaction.emoji.name;
			const callback = this._reactions[this._reactionsNames.indexOf(reactionName)].removeCallback;
			if (callback) {
				callback(this, reaction, user);
			}
		});
		this._collector.on("end", () => {
			if (this._endCallback) {
				this._endCallback(this);
			}
		});
		for (const reaction of this._reactions) {
			try {
				await this._sentMessage.react(reaction.emote);
			}
			catch {
				const emoji = (await draftBotClient.shard.broadcastEval((client, context) => {
					const emoji: any = client.emojis.cache.get(context.emote);
					if (emoji) {
						return emoji;
					}
				}, {
					context: {
						emote: reaction.emote
					}
				})).filter(e => e)[0];
				await this._sentMessage.react(emoji.identifier);
			}
		}
	}
}

/**
 * Builder for {@link DraftBotReactionMessage}
 */
export class DraftBotReactionMessageBuilder {
	private _reactions: DraftBotReaction[] = [];

	private _allowedUsersDiscordIdToReact: string[] = [];

	private _endCallback: (msg: DraftBotReactionMessage) => Promise<void> | void = undefined;

	private _maxReactions = 0;

	private _anyUserAllowed = false;

	private _collectorTime = 0;

	/**
	 * Allow a user to react to the message
	 * @param user
	 */
	allowUser(user: User): DraftBotReactionMessageBuilder {
		this._allowedUsersDiscordIdToReact.push(user.id);
		return this;
	}

	/**
	 * Allow a user id to react to the message
	 * @param id
	 */
	allowUserId(id: string): DraftBotReactionMessageBuilder {
		this._allowedUsersDiscordIdToReact.push(id);
		return this;
	}

	/**
	 * Add a reaction to the message
	 * @param reaction
	 */
	addReaction(reaction: DraftBotReaction): DraftBotReactionMessageBuilder {
		this._reactions.push(reaction);
		return this;
	}

	/**
	 * Set the callback when the message collector ends
	 * @param callback
	 */
	endCallback(callback: (msg: DraftBotReactionMessage) => Promise<void> | void): DraftBotReactionMessageBuilder {
		this._endCallback = callback;
		return this;
	}

	/**
	 * Set the max reactions to the message
	 * @param max
	 */
	maxReactions(max: number): DraftBotReactionMessageBuilder {
		this._maxReactions = max;
		return this;
	}

	/**
	 * Allow any user to react to the message
	 */
	allowAnyUser(): DraftBotReactionMessageBuilder {
		this._anyUserAllowed = true;
		return this;
	}

	/**
	 * Indicate the time of the collector
	 * @param time
	 */
	collectorTime(time: number): DraftBotReactionMessageBuilder {
		this._collectorTime = time;
		return this;
	}

	/**
	 * Build the message
	 */
	build(): DraftBotReactionMessage {
		return new DraftBotReactionMessage(this._reactions,
			this._allowedUsersDiscordIdToReact,
			this._endCallback,
			this._maxReactions,
			this._anyUserAllowed,
			this._collectorTime);
	}
}