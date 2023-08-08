import {FightAction} from "../../FightAction";
import {Fighter} from "../../../fighter/Fighter";
import {MonsterLocations} from "../../../../database/game/models/MonsterLocation";
import {RandomUtils} from "../../../../utils/RandomUtils";
import {Translations} from "../../../../Translations";
import {FightController} from "../../../FightController";
import {FightWeather} from "../../../FightWeather";
import {FightActions} from "../../FightActions";
import MonsterAttack from "../../../../database/game/models/MonsterAttack";
import Monster from "../../../../database/game/models/Monster";

export default class MonstrousCopyAttack extends FightAction {
	async use(sender: Fighter, receiver: Fighter, turn: number, language: string, weather: FightWeather): Promise<string> {
		// Get a random monster, then choose one of its attacks, then try to use it
		const monstrousCopyTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		let monster: { monster: Monster, attacks: MonsterAttack[] };
		let chosenAttack: FightAction;
		do {
			monster = await MonsterLocations.getRandomMonster();
			chosenAttack = FightActions.getFightActionById(RandomUtils.draftbotRandom.pick(monster.attacks).attackId);
		} while (chosenAttack.name === this.name);
		return monstrousCopyTranslationModule.format("active", {
			monsterName: monster.monster.getName(language),
			attackName: chosenAttack.toString(language)
		}) + "\n" + Translations.getModule("commands.fight", language).format("actions.intro", {
			emote: chosenAttack.getEmoji(),
			player: sender.getMention()
		}) + (await FightController.tryToExecuteFightAction(chosenAttack, sender, receiver, turn, language, weather)).receivedMessage;
	}

}