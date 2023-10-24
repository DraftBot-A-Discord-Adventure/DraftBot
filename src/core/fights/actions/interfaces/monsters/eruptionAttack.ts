import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightWeather, FightWeatherEnum} from "../../../FightWeather";
import {Translations} from "../../../../Translations";

export default class EruptionAttack extends FightAction {
	use(fightAction: FightAction, sender: Fighter, receiver: Fighter, turn: number, language: string, weather: FightWeather): string {
		weather.setWeather(FightWeatherEnum.FIRESTORM, turn, sender);
		const eruptionTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		return eruptionTranslationModule.get("active");
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 100, averageDamage: 300, maxDamage: 400};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack()
			], defenderStats: [
				receiver.getDefense()
			], statsEffect: [
				1
			]
		};
	}
}