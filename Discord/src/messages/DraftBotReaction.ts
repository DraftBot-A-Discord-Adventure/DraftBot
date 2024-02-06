import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {MessageReaction, User} from "discord.js";

/**
 * Reaction to a {@link DraftBotReactionMessage}
 */
export type CallbackLike = (msg?: DraftBotReactionMessage, reaction?: MessageReaction, user?: User) => Promise<void> | void;

/**
 * Reaction to a {@link DraftBotReactionMessage}
 */
export class DraftBotReaction {
	private readonly _emote: string;

	private readonly _callback: CallbackLike | null;

	private readonly _removeCallback: CallbackLike | null;

	/**
	 * Default constructor
	 * @param emote
	 * @param callback Can be null to terminate the collector when the reaction is chosen
	 * @param removeCallback Can be null to be ignored
	 */
	constructor(
		emote: string,
		callback: CallbackLike | null = null,
		removeCallback: CallbackLike | null = null
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
	get callback(): CallbackLike | null {
		return this._callback;
	}

	/**
	 * Get the callback when the reaction is removed
	 */
	get removeCallback(): CallbackLike | null {
		return this._removeCallback;
	}
}