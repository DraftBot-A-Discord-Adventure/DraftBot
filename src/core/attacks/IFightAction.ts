import {Fighter} from "../fights/Fighter";

export type IFightAction = {
	/**
	 * Use the action the sender chose
	 * @param sender - the one who does the action
	 * @param receiver - the one who undergo the action
	 * @param language - the language of the message
	 */
	use(sender: Fighter, receiver: Fighter, language : string): string;
}