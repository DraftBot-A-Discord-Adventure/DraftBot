import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {DraftBotReaction} from "./DraftBotReaction";
import {MessageReaction, User} from "discord.js";
import {Constants} from "../Constants";

/**
 * An embed with validate or refuse reactions
 */
export class DraftBotValidateReactionMessage extends DraftBotReactionMessage {
	/**
	 * Default constructor
	 * @param allowedUser
	 * @param endCallback
	 * @param validateCallback
	 * @param refuseCallback
	 */
	constructor(
		allowedUser: User,
		endCallback: (msg: DraftBotReactionMessage) => void | Promise<void>,
		validateCallback: (msg: DraftBotReactionMessage, reaction: MessageReaction, user: User) => void = null,
		refuseCallback: (msg: DraftBotReactionMessage, reaction: MessageReaction, user: User) => void = null
	) {
		super(
			{
				reactions: [
					new DraftBotReaction(Constants.REACTIONS.VALIDATE_REACTION, validateCallback),
					new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION, refuseCallback)
				],
				allowedUsersDiscordIdToReact: allowedUser ? [allowedUser.id] : null,
				anyUserAllowed: !allowedUser
			},
			endCallback
		);
	}

	/**
	 * Returns if someone reacted yes
	 */
	isValidated(): boolean {
		return this.someoneReacted() && this.collector.collected.first().emoji.name === Constants.REACTIONS.VALIDATE_REACTION;
	}

	/**
	 * Returns if someone reacted
	 */
	someoneReacted(): boolean {
		return this.collector && !!this.collector.collected.first();
	}
}