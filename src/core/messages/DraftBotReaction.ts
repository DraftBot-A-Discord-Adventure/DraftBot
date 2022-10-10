import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {MessageReaction, User} from "discord.js";

/**
 * Reaction to a {@link DraftBotReactionMessage}
 */
export type CallbackLike = (msg?: DraftBotReactionMessage, reaction?: MessageReaction, user?: User) => Promise<void> | void;

export class DraftBotReaction {
	private readonly _emote: string;

	private readonly _callback: CallbackLike;

	private readonly _removeCallback: CallbackLike;

	/**
	 * Default constructor
	 * @param emote
	 * @param callback Can be null to terminate the collector when the reaction is chosen
	 * @param removeCallback Can be null to be ignored
	 */
	constructor(
		emote: string,
		callback: CallbackLike = null,
		removeCallback: CallbackLike = null
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
	get callback(): CallbackLike {
		return this._callback;
	}

	/**
	 * Get the callback when the reaction is removed
	 */
	get removeCallback(): CallbackLike {
		return this._removeCallback;
	}
}