import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/Fighter";
import {Translations} from "../../Translations";
import {format} from "../../utils/StringFormatter";
import {Data} from "../../Data";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../constants/FightConstants";

type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };
type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

export const fightActionInterface: IFightAction = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.getPlayerLevel(), this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 5);
		receiver.stats.fightPoints -= damageDealt;

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// half of the damage is converted to fight points
		const healAmount = Math.round(damageDealt / 2);
		sender.stats.fightPoints += healAmount;
		if (sender.stats.fightPoints > sender.stats.maxFightPoint) {
			sender.stats.fightPoints = sender.stats.maxFightPoint;
		}
		const sideEffects = attackTranslationModule.format("actions.sideEffects.energy", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.PLUS,
			amount: healAmount
		});

		const attackStatus = this.getAttackStatus(damageDealt, initialDamage);
		const chosenString = attackTranslationModule.getRandom(`actions.attacksResults.${attackStatus}`);
		return format(chosenString, {
			attack: Translations.getModule("fightactions." + this.getName(), language)
				.get("name")
				.toLowerCase()
		}) + sideEffects + Translations.getModule("commands.fight", language).format("actions.damages", {
			damages: damageDealt
		});
	}
	,

	toString(language
	:
		string
	):
		string {
		return Translations.getModule(`fightactions.${this.getName()}`, language).get("name");
	}
	,

	getEmoji()
	:
		string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	}
	,

	getName()
	:
		string {
		return "energeticAttack";
	}
	,

	getAttackInfo()
	:
		attackInfo {
		return {minDamage: 30, averageDamage: 60, maxDamage: 90};
	}
	,

	getStatsInfo(sender
	:
		Fighter, receiver
	:
		Fighter
	):
		statsInfo {
		return {
			attackerStats: [
				sender.stats.attack,
				sender.stats.speed
			], defenderStats: [
				receiver.stats.defense * 0.2,
				receiver.stats.speed
			], statsEffect: [
				0.75,
				0.25
			]
		};
	}
	,

	getAttackStatus(damageDealt
	:
		number, initialDamage
	:
		number
	) {
		return damageDealt > initialDamage
			? FightConstants.ATTACK_STATUS.CRITICAL
			: damageDealt < initialDamage
				? FightConstants.ATTACK_STATUS.MISSED
				: FightConstants.ATTACK_STATUS.NORMAL;
	}
};