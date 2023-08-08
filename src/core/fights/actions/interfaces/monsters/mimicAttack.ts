import {FightAction} from "../../FightAction";
import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightController} from "../../../FightController";
import {FightWeather} from "../../../FightWeather";

export default class MimicAttack extends FightAction {
	async use(sender: Fighter, receiver: Fighter, turn: number, language: string, weather: FightWeather): Promise<string> {
		// Get a random monster, then choose one of its attacks, then try to use it
		const mimicTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		const chosenAttack = receiver.getRandomAvailableFightAction();
		return mimicTranslationModule.format("active", {
			attackName: chosenAttack.toString(language)
		}) + "\n" + Translations.getModule("commands.fight", language).format("actions.intro", {
			emote: chosenAttack.getEmoji(),
			player: sender.getMention()
		}) + (await FightController.tryToExecuteFightAction(chosenAttack, sender, receiver, turn, language, weather)).receivedMessage;
	}

}