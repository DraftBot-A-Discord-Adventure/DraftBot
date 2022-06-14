import {FightController} from "./FightController";
import {Message, TextBasedChannel} from "discord.js";
import {Fighter} from "./Fighter";
import {TranslationModule, Translations} from "../Translations";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";

export class FightView {

	public channel: TextBasedChannel;

	public language: string;

	private fightController: FightController;

	private fightTranslationModule: TranslationModule;

	private lastSummary: Message;

	private actionMessages: Message[];

	public constructor(channel: TextBasedChannel, language: string, fightController: FightController) {
		this.channel = channel;
		this.language = language;
		this.fightController = fightController;
		this.fightTranslationModule = Translations.getModule("commands.fight", language);
	}


	/**
	 * Send the fight intro message
	 * @param fighter1
	 * @param fighter2
	 */
	public introduceFight(fighter1: Fighter, fighter2: Fighter) {
		this.channel.send({
			content: this.fightTranslationModule.format("intro", {
				player1: fighter1.getMention(),
				player2: fighter2.getMention()
			})
		}).then();
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
	 * Scroll the messages down if needed before fight display status
	 * @return {Promise<void>}
	 */
	private async scrollIfNeeded() {
		const messages = await this.channel.messages.fetch({limit: 1});
		if (this.lastSummary !== undefined && messages.first().createdTimestamp !== this.lastSummary.createdTimestamp) {
			for (let i = 0; i < this.actionMessages.length; ++i) {
				const content = (await this.channel.messages.fetch(this.actionMessages[i].id)).content;
				await this.actionMessages[i].delete();
				this.actionMessages[i] = await this.channel.send({content: content});
			}
			await this.lastSummary.delete();
			this.lastSummary = undefined;
		}
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
}
