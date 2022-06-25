import {FightController} from "./FightController";
import {Collection, Message, MessageReaction, Snowflake, TextBasedChannel} from "discord.js";
import {Fighter} from "./Fighter";
import {TranslationModule, Translations} from "../Translations";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {IFightAction} from "../attacks/IFightAction";
import {FightConstants} from "../constants/FightConstants";
import {millisecondsToMinutes, minutesDisplay} from "../utils/TimeUtils";

/**
 * @class FightController
 */
export class FightView {

	public channel: TextBasedChannel;

	public language: string;

	private fightController: FightController;

	private readonly fightTranslationModule: TranslationModule;

	private lastSummary: Message;

	private readonly actionMessages: Message[];

	private fightLaunchMessage: Message;

	public constructor(channel: TextBasedChannel, language: string, fightController: FightController) {
		this.channel = channel;
		this.language = language;
		this.fightController = fightController;
		this.fightTranslationModule = Translations.getModule("commands.fight", language);
		this.actionMessages = [];
	}

	/**
	 * Get the selected action from the reaction
	 * @param reaction
	 * @param actions
	 * @private
	 */
	private static getSelectedAction(reaction: Collection<Snowflake, MessageReaction>, actions: Map<string, IFightAction>) {
		if (!reaction.first()) {
			return null;
		}
		const selectedActionEmoji = reaction.first().emoji.name;
		for (const [, action] of actions) {
			if (action.getEmoji() === selectedActionEmoji) {
				return action;
			}
		}
		return null; // impossible in theory
	}

	/**
	 * Add the fight action field to the intro embed that correspond to the fighter
	 * @param introEmbed
	 * @param fighter
	 */
	async addFightActionFieldFor(introEmbed: DraftBotEmbed, fighter: Fighter) {
		introEmbed.addField(
			this.fightTranslationModule.format("actionsOf", {
				player: await fighter.getPseudo(this.language)
			}),
			this.getFightActionsToStringOf(fighter),
			true
		);
	}

	/**
	 * Send the fight intro message
	 * @param fighter1
	 * @param fighter2
	 */
	async introduceFight(fighter1: Fighter, fighter2: Fighter) {
		// ce serait ici qu'il faudrait mettre les attaques ?
		const introEmbed = new DraftBotEmbed()
			.setTitle(this.fightTranslationModule.format("intro", {
				player1: await fighter1.getPseudo(this.language),
				player2: await fighter2.getPseudo(this.language)
			}));
		await this.addFightActionFieldFor(introEmbed, fighter1);
		await this.addFightActionFieldFor(introEmbed, fighter2);
		this.fightLaunchMessage = await this.channel.send({
			embeds: [introEmbed]
		});
		this.actionMessages.push(await this.channel.send({content: "_ _"}));
	}

	/**
	 *  summarize current fight status
	 */
	async displayFightStatus() {
		await this.scrollIfNeeded();
		const playingFighter = this.fightController.getPlayingFighter();
		const defendingFighter = this.fightController.getDefendingFighter();
		if (this.lastSummary === undefined) {
			this.lastSummary = await this.channel.send({embeds: [await this.getSummarizeEmbed(playingFighter, defendingFighter)]});
		}
		else {
			await this.lastSummary.edit({embeds: [await this.getSummarizeEmbed(playingFighter, defendingFighter)]});
		}
	}

	/**
	 * display a menu that allows a fighter to select an action
	 * @param fighter
	 */
	async selectFightActionMenu(fighter: Fighter) {
		const actions: Map<string, IFightAction> = fighter.availableFightActions;
		const chooseActionEmbedMessage = await this.sendChooseActionEmbed(fighter);
		const collector = chooseActionEmbedMessage.createReactionCollector({
			filter: (reaction) => reaction.me && reaction.users.cache.last().id === fighter.getDiscordId(),
			time: FightConstants.TIME_FOR_ACTION_SELECTION,
			max: 1
		});
		collector.on("end", (reaction) => {
			const selectedAction = FightView.getSelectedAction(reaction, actions);
			chooseActionEmbedMessage.delete();
			if (selectedAction === null) {
				// USER HASN'T SELECTED AN ACTION
				fighter.suicide();
				this.fightController.endFight();
				return;
			}
			this.fightController.executeFightAction(selectedAction).finally(() => null);
		});
		const reactions = [];
		for (const [, action] of actions) {
			reactions.push( chooseActionEmbedMessage.react(action.getEmoji()));
		}
		await Promise.all(reactions);
	}

	/**
	 * Get summarize embed message
	 * @param {Fighter} attacker
	 * @param {Fighter} defender
	 * @return {Promise<DraftBotEmbed>}
	 */
	private async getSummarizeEmbed(attacker: Fighter, defender: Fighter) {
		return new DraftBotEmbed()
			.setTitle(this.fightTranslationModule.get("summarize.title"))
			.setDescription(this.fightTranslationModule.get("summarize.intro") +
				await attacker.getStringDisplay(this.fightTranslationModule) + "\n\n" +
				await defender.getStringDisplay(this.fightTranslationModule));
	}

	/**
	 * Update the fight history
	 * @param emote
	 * @param player
	 * @param receivedMessage
	 */
	async updateHistory(emote: string, player: string, receivedMessage: string) {
		const lastMessage = this.actionMessages[this.actionMessages.length - 1];
		const messageToSend = this.fightTranslationModule.format("actions.intro", {
			emote,
			player
		}) + receivedMessage;
		if (lastMessage.content.length + messageToSend.length > 1950) {
			// message character limit reached : creation of a new message
			await this.lastSummary.delete();
			this.lastSummary = undefined;
			this.actionMessages.push(await this.channel.send({content: messageToSend}));
		}
		else if (lastMessage.content === "_ _") {
			// First action of the fight, no history yet
			await lastMessage.edit({content: messageToSend});
		}
		else {
			// An history already exists, just append the new action
			await lastMessage.edit({content: `${lastMessage.content}\n${messageToSend}`});
		}
	}

	/**
	 * Get send the fight outro message
	 * @param loser
	 * @param winner
	 * @param draw
	 */
	async outroFight(loser: Fighter, winner: Fighter, draw: boolean) {
		if (this.lastSummary !== undefined) {
			setTimeout(() => this.lastSummary.delete(), 5000);
		}
		let msg;
		if (!draw) {
			msg = this.fightTranslationModule.format("end.win", {
				winner: winner.getMention(),
				loser: loser.getMention()
			});
		}
		else {
			msg = this.fightTranslationModule.format("end.draw", {
				player1: winner.getMention(),
				player2: loser.getMention()
			});
		}
		msg += this.fightTranslationModule.format("end.gameStats", {
			turn: this.fightController.turn,
			maxTurn: FightConstants.MAX_TURNS,
			time: minutesDisplay(millisecondsToMinutes(new Date().valueOf() - this.fightLaunchMessage.createdTimestamp))
		});

		for (const fighter of [winner, loser]) {
			msg += this.fightTranslationModule.format("end.fighterStats", {
				pseudo: await fighter.getPseudo(this.language),
				health: fighter.stats.fightPoints,
				maxHealth: fighter.stats.maxFightPoint
			});
		}

		this.channel.send({embeds: [new DraftBotEmbed().setDescription(msg)]});
	}

	/**
	 * Scroll the messages down if needed before fight display status
	 * @return {Promise<void>}
	 */
	private async scrollIfNeeded() {
		const messages = await this.channel.messages.fetch({limit: 1});
		if (this.lastSummary !== undefined && messages.first().createdTimestamp !== this.lastSummary.createdTimestamp) {
			for (let i = 0; i < this.actionMessages.length; ++i) {
				const content = (await this.channel.messages.fetch(this.actionMessages[i].id)).content;
				await this.actionMessages[i].edit(content);
			}
			await this.lastSummary.delete();
			this.lastSummary = undefined;
		}
	}

	/**
	 * Send the choose action embed message
	 * @param fighter
	 * @private
	 */
	private async sendChooseActionEmbed(fighter: Fighter) {
		const chooseActionEmbed = new DraftBotEmbed();
		chooseActionEmbed.formatAuthor(this.fightTranslationModule.format("turnIndicationsTitle", {pseudo: await fighter.getPseudo(this.language)}), fighter.getUser());
		chooseActionEmbed.setDescription(this.fightTranslationModule.get("turnIndicationsDescription"));
		return (await this.channel.send({embeds: [chooseActionEmbed]})) as Message;
	}

	/**
	 * Get the list of actions available for the fighter in a displayable format
	 * @param fighter
	 * @private
	 */
	private getFightActionsToStringOf(fighter: Fighter): string {
		const fightActions = fighter.availableFightActions;
		let actionList = "";
		for (const [, action] of fightActions) {
			actionList += `${action.getEmoji()} - ${action.toString(this.language)}\n`;
		}
		return actionList;
	}
}
