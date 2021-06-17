import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {DMChannel, Message, MessageReaction, NewsChannel, TextChannel, User} from "discord.js";
import {DraftBotReaction} from "./DraftBotReaction";
import {Constants} from "../Constants";

/**
 * Trade message and executor
 */
export class DraftBotTradeMessage extends DraftBotReactionMessage {
	/**
	 * If the trader number 1 accepted the trade. true = yes, false = no, null = no choice
	 */
	public trader1Accepted: boolean = null;

	/**
	 * If the trader number 2 accepted the trade. true = yes, false = no, null = no choice
	 */
	public trader2Accepted: boolean = null;

	/**
	 * The id of the trader number 1
	 * @private
	 */
	private readonly trader1id: string;

	/**
	 * The callback called if the trade is successful
	 */
	public readonly tradeSuccessCallback: (message: DraftBotTradeMessage) => void;

	/**
	 * The callback called if someone refused the trade
	 */
	public readonly tradeRefusedCallback: (message: DraftBotTradeMessage) => void;

	/**
	 * The callback called if someone didn't react
	 */
	public readonly tradeNoResponseCallback: (message: DraftBotTradeMessage) => void;

	/**
	 * Default constructor
	 * @param trader1
	 * @param trader2
	 * @param tradeSuccess
	 * @param tradeRefused
	 * @param tradeNoResponse
	 */
	constructor(
		trader1: User,
		trader2: User,
		tradeSuccess: (message: DraftBotTradeMessage) => void,
		tradeRefused: (message: DraftBotTradeMessage) => void,
		tradeNoResponse: (message: DraftBotTradeMessage) => void
	) {
		super(
			[
				new DraftBotReaction(Constants.REACTIONS.VALIDATE_REACTION, DraftBotTradeMessage.validateCallback),
				new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION, DraftBotTradeMessage.refuseCallback)
			],
			[
				trader1.id,
				trader2.id
			],
			DraftBotTradeMessage.endCallback,
			0,
			false,
			0
		);
		this.trader1id = trader1.id;
		this.tradeSuccessCallback = tradeSuccess;
		this.tradeRefusedCallback = tradeRefused;
		this.tradeNoResponseCallback = tradeNoResponse;
	}

	private static validateCallback(message: DraftBotReactionMessage, reaction: MessageReaction, user: User): void {
		const tradeMessage: DraftBotTradeMessage = message as DraftBotTradeMessage;
		if (user.id === tradeMessage.trader1id) {
			tradeMessage.trader1Accepted = true;
		}
		else {
			tradeMessage.trader2Accepted = true;
		}
		if (tradeMessage.trader1Accepted === true && tradeMessage.trader2Accepted === true) {
			message.collector.stop();
		}
	}

	private static refuseCallback(message: DraftBotReactionMessage, reaction: MessageReaction, user: User): void {
		const tradeMessage: DraftBotTradeMessage = message as DraftBotTradeMessage;
		if (user.id === tradeMessage.trader1id) {
			tradeMessage.trader1Accepted = false;
		}
		else {
			tradeMessage.trader2Accepted = false;
		}
		message.collector.stop();
	}

	private static endCallback(message: DraftBotReactionMessage): void {
		const tradeMessage: DraftBotTradeMessage = message as DraftBotTradeMessage;
		if (tradeMessage.trader1Accepted && tradeMessage.trader2Accepted) {
			return tradeMessage.tradeSuccessCallback(message as DraftBotTradeMessage);
		}
		if (tradeMessage.trader1Accepted === false || tradeMessage.trader2Accepted === false) {
			return tradeMessage.tradeRefusedCallback(message as DraftBotTradeMessage);
		}
		return tradeMessage.tradeNoResponseCallback(message as DraftBotTradeMessage);
	}

	/**
	 * Send the trade in a channel
	 * @param channel
	 */
	async send(channel: TextChannel | DMChannel | NewsChannel): Promise<Message> {
		const messageReturned = await super.send(channel);
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const thisMessage = this;
		this.collector.on("remove", (reaction, user) => {
			if (reaction.emoji.name === Constants.REACTIONS.VALIDATE_REACTION) {
				if (user.id === messageReturned.author.id) {
					thisMessage.trader1Accepted = null;
				}
				else {
					thisMessage.trader2Accepted = null;
				}
			}
		});
		return messageReturned;
	}
}