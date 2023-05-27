import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAction} from "../../FightAction";
import {FightConstants} from "../../../../constants/FightConstants";
import {FightWeather} from "../../../FightWeather";

export default class RoarAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string, weather: FightWeather): string {
		const roarTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		const attackTranslationModule = Translations.getModule("commands.fight", language);

		const statsReducePercentage = 10;
		receiver.applyAttackModifier({
			origin: this,
			operation: FightStatModifierOperation.MULTIPLIER,
			value: 1 - statsReducePercentage / 100
		});
		receiver.applySpeedModifier({
			origin: this,
			operation: FightStatModifierOperation.MULTIPLIER,
			value: 1 - statsReducePercentage / 100
		});

		return roarTranslationModule.get("active") + attackTranslationModule.format("actions.sideEffects.attack", {
			adversary: FightConstants.TARGET.OPPONENT,
			operator: "-",
			amount: statsReducePercentage
		}) + attackTranslationModule.format("actions.sideEffects.speed", {
			adversary: FightConstants.TARGET.OPPONENT,
			operator: "-",
			amount: statsReducePercentage
		});
	}
}