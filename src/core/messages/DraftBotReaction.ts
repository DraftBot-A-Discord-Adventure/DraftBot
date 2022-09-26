import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {MessageReaction, User} from "discord.js";

/**
 * Reaction to a {@link DraftBotReactionMessage}
 */
export class DraftBotReaction {
	private readonly _emote: string;

	private readonly _callback: (msg: DraftBotReactionMessage, reaction: MessageReaction, user: User) => void;

	private readonly _removeCallback: (msg: DraftBotReactionMessage, reaction: MessageReaction, user: User) => void;

	/**
	 * Default constructor
	 * @param emote
	 * @param callback Can be null to terminate the collector when the reaction is chosen
	 * @param removeCallback Can be null to be ignored
	 */
	constructor(
		emote: string,
		callback: (msg: DraftBotReactionMessage, reaction: MessageReaction, user: User) => void = null,
		removeCallback: (msg: DraftBotReactionMessage, reaction: MessageReaction, user: User) => void = null
	) {
		this._emote = emote;
		this._callback = callback;
		this._removeCallback = removeCallback;
	}

	/**
	 * Get the emote
	 */
	get emote(): string {
		return this._emote;
	}

	/**
	 * Get the callback
	 */
	get callback(): (msg: DraftBotReactionMessage, reaction: MessageReaction, user: User) => void {
		return this._callback;
	}

	/**
	 * Get the callback when the reaction is removed
	 */
	get removeCallback(): (msg: DraftBotReactionMessage, reaction: MessageReaction, user: User) => void {
		return this._removeCallback;
	}
}