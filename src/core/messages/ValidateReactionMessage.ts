import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {DraftBotReaction} from "./DraftBotReaction";
import {MessageReaction, User} from "discord.js";
import {Constants} from "../Constants";

export class ValidateReactionMessage extends DraftBotReactionMessage {
	constructor(allowedUser: User,
		endCallback: (msg: DraftBotReactionMessage) => void,
		validateCallback: (msg: DraftBotReactionMessage, reaction: MessageReaction, user: User) => void = null,
		refuseCallback: (msg: DraftBotReactionMessage, reaction: MessageReaction, user: User) => void = null
	) {
		super(
			[
				new DraftBotReaction(Constants.REACTIONS.VALIDATE_REACTION, validateCallback),
				new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION, refuseCallback)
			],
			allowedUser ? [allowedUser.id] : null,
			endCallback,
			0,
			!allowedUser,
			0
		);
	}

	isValidated(): boolean {
		return this.someoneReacted() && this.collector.collected.first().emoji.name === Constants.REACTIONS.VALIDATE_REACTION;
	}

	someoneReacted(): boolean {
		return this.collector && !!this.collector.collected.first();
	}
}