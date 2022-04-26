import {FightController} from "./FightController";
import {TextChannel} from "discord.js";
import {Fighter} from "./Fighter";
import {TranslationModule} from "../Translations";

export class FightView {

	public channel: TextChannel;

	public language: string;

	private fightController: FightController;

	private fightTranslationModule: TranslationModule;


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
	 * Scroll the messages down if needed
	 * @return {Promise<void>}
	 */
	async scrollIfNeeded() {
		const messages = await this.channel.messages.fetch({limit: 1});
		if (this.lastSummary !== undefined && messages.first().createdTimestamp !== this.lastSummary.createdTimestamp) {
			for (let i = 0; i < this.actionMessages.length; ++i) {
				const content = (await this.message.channel.messages.fetch(this.actionMessages[i].id)).content;
				await this.actionMessages[i].delete();
				this.actionMessages[i] = await this.message.channel.send({content: content});
			}
			await this.lastSummary.delete();
			this.lastSummary = undefined;
			await this.summarizeFight();
		}
	}
}
