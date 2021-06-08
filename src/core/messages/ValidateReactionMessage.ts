import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {DraftBotReaction} from "./DraftBotReaction";
import {MessageReaction, User} from "discord.js";
import {Constants} from "../Constants";

export class ValidateReactionMessage extends DraftBotReactionMessage {
	constructor(validateCallback: (msg: DraftBotReactionMessage, reaction: MessageReaction, user: User) => void,
		refuseCallback: (msg: DraftBotReactionMessage, reaction: MessageReaction, user: User) => void,
		allowedUser: User) {
		super(
			[
				new DraftBotReaction(Constants.REACTIONS.VALIDATE_REACTION, validateCallback),
				new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION, refuseCallback)
			],
			allowedUser ? [allowedUser.id] : null,
			() => { /* void */ },
			0,
			!allowedUser,
			0
		);
	}
}