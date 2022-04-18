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
}
