import {CommandInteraction, Message, MessageReaction, ReactionCollector, User} from "discord.js";
import {DraftBotEmbed} from "./DraftBotEmbed";
import {Constants} from "../Constants";
import {BlockingUtils} from "../utils/BlockingUtils";
import {sendErrorMessage} from "../utils/ErrorUtils";
import {Translations} from "../Translations";
import {format} from "../utils/StringFormatter";
import {Entities} from "../database/game/models/Entity";

type BroadcastTranslationModuleLike = {
	errorBroadcastCancelled: string,
	errorSelfAccept: string,
	errorSelfAcceptSpam: string,
	errorOtherDeny: string,
	errorNoAnswer: string
}

/**
 * Base class for bot embeds
 */
export class DraftBotBroadcastValidationMessage extends DraftBotEmbed {
	private readonly _interaction: CommandInteraction

	private _collector: ReactionCollector;

	private _translationModule: BroadcastTranslationModuleLike;

	private readonly _acceptCallback: (user: User) => Promise<boolean>;

	private _broadcastMessage: Message;

	private _spamCount: number;

	private _wrongAnswer: number;

	private _spammers: string[];

	private _gotAnAnswer: boolean;

	private _answerer: User;

	private readonly _language: string;

	private readonly _collectorTime: number;

	private readonly _blockingReason: string;

	/**
	 * Creates a broadcast validation message
	 * @param interaction
	 * @param language
	 * @param acceptCallback callback to call when someone accepts the broadcast<br/>
	 *          MUST RETURN if the broadcast should end or not, depending on if the user shouldn't be able to react
	 * @param blockingReason
	 * @param translationModule strings to call when there's errors during the broadcast
	                if not specified, will take default ones
	 * @param collectorTime
	 */
	constructor(
		interaction: CommandInteraction,
		language: string,
		acceptCallback: (user: User) => Promise<boolean>,
		blockingReason: string,
		translationModule: BroadcastTranslationModuleLike = null,
		collectorTime = Constants.MESSAGES.COLLECTOR_TIME) {
		super();
		this._interaction = interaction;
		this._language = language;
		this._acceptCallback = acceptCallback;
		this._collectorTime = collectorTime;
		this._blockingReason = blockingReason;
		this._spamCount = 0;
		this._wrongAnswer = 0;
		this._spammers = [];
		this._gotAnAnswer = false;
		this._answerer = null;
		if (translationModule === null) {
			const tmp = Translations.getModule("messages.broadcastValidation", this._language);
			this._translationModule = {
				errorBroadcastCancelled: tmp.get("errorBroadcastCancelled"),
				errorSelfAccept: tmp.get("errorSelfAccept"),
				errorSelfAcceptSpam: tmp.get("errorSelfAcceptSpam"),
				errorOtherDeny: tmp.get("errorOtherDeny"),
				errorNoAnswer: tmp.get("errorNoAnswer")
			};
		}
		else {
			this._translationModule = translationModule;
		}
	}

	/**
	 * Send a broadcast request and returns the message
	 */
	async reply() {
		this._broadcastMessage = await this._interaction.reply({embeds: [this], fetchReply: true}) as Message;
		await this.createAndManageCollector();
		return this._broadcastMessage;
	}

	/**
	 * create and manage the collector
	 * @private
	 */
	private async createAndManageCollector() {
		this._collector = this._broadcastMessage.createReactionCollector({
			filter: (reaction: MessageReaction, user: User) => !user.bot,
			time: this._collectorTime
		});
		BlockingUtils.blockPlayerWithCollector(this._interaction.user.id, this._blockingReason, this._collector);
		this.manageCollectedAnswers();
		await Promise.all([this._broadcastMessage.react(Constants.MENU_REACTION.ACCEPT), this._broadcastMessage.react(Constants.MENU_REACTION.DENY)]);
	}

	/**
	 * manage the collector reactions
	 * @private
	 */
	private manageCollectedAnswers() {
		this._collector.on("collect", async (reaction: MessageReaction, user: User) => {
			await this.checkReactionBroadcastCollector(user, reaction);
		});

		this._collector.on("end", async () => {
			if (!this._gotAnAnswer && this._answerer === null) {
				BlockingUtils.unblockPlayer(this._interaction.user.id, this._blockingReason);
				await sendErrorMessage(
					this._interaction.user,
					this._interaction,
					this._language,
					this._translationModule.errorNoAnswer
				);
			}
		});
	}

	/**
	 * check if the reaction is a valid one
	 * @param user
	 * @param reaction
	 * @private
	 */
	private async checkReactionBroadcastCollector(user: User, reaction: MessageReaction) {
		if (!this.isBroadcastStillActive(reaction)) {
			return;
		}
		switch (reaction.emoji.name) {
		case Constants.MENU_REACTION.ACCEPT:
			if (!await this.manageAcceptReaction(user)) {
				return;
			}
			break;
		case Constants.MENU_REACTION.DENY:
			if (!await this.manageDenyReaction(user)) {
				return;
			}
			break;
		default:
			return;
		}
		this._gotAnAnswer = true;
		this._collector.stop();
	}

	/**
	 * Check if a broadcast message is still active or not (avoid duplicate answers from the bot, for example in spam situation or sync reactions)
	 * @param reaction
	 */
	private isBroadcastStillActive(reaction: MessageReaction): boolean {
		const hasMainDenied = this._collector.collected.get(Constants.MENU_REACTION.DENY) &&
			this._collector.collected.get(Constants.MENU_REACTION.DENY).users.cache.has(this._interaction.user.id);
		// has the main user cancelled the broadcast
		if (hasMainDenied && this._interaction.user.id !== reaction.users.cache.at(reaction.users.cache.keys.length - 1).id) {
			return false;
		}
		// has any user already accepted correctly the broadcast
		return !(this._collector.collected.get(Constants.MENU_REACTION.ACCEPT) &&
			this._collector.collected.get(Constants.MENU_REACTION.ACCEPT).count > this._spamCount + this._wrongAnswer + 1 +
			(hasMainDenied ? 0 : 1));
	}

	/**
	 * Manage the deny reaction
	 * @param user
	 * @private
	 */
	private async manageDenyReaction(user: User) {
		if (this._interaction.user.id === user.id) {
			await sendErrorMessage(user, this._interaction, this._language, this._translationModule.errorBroadcastCancelled, true);
			BlockingUtils.unblockPlayer(user.id, this._blockingReason);
			return true;
		}
		if (this._spammers.includes(user.id)) {
			return false;
		}
		this._spammers.push(user.id);
		await sendErrorMessage(this._interaction.user, this._interaction, this._language,
			format(this._translationModule.errorOtherDeny, {pseudo: (await Entities.getByDiscordUserId(user.id)).getMention()}));
		return false;
	}

	/**
	 * Manage the accept reaction
	 * @param user
	 * @private
	 */
	private async manageAcceptReaction(user: User) {
		if (user.id === this._interaction.user.id) {
			this._spamCount++;
			if (this._spamCount < Constants.MESSAGES.MAX_SPAM_COUNT) {
				await sendErrorMessage(user, this._interaction, this._language, this._translationModule.errorSelfAccept);
				return false;
			}
			await sendErrorMessage(user, this._interaction, this._language, this._translationModule.errorSelfAcceptSpam);
			BlockingUtils.unblockPlayer(user.id, this._blockingReason);
			return true;
		}
		if (await this._acceptCallback(user)) {
			this._answerer = user;
			return true;
		}
		this._wrongAnswer++;
		return false;
	}
}