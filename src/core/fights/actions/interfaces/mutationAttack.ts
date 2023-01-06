import {Fighter} from "../../fighter/Fighter";
import {TranslationModule, Translations} from "../../../Translations";
import {format} from "../../../utils/StringFormatter";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../../constants/FightConstants";
import {PlayerFighter} from "../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../FightAction";

export default class MutationAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 1, 5);
		receiver.stats.fightPoints -= damageDealt;

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// the opponent has his best stat (attack defense or speed) exchanged with his worst stat
		const {opponentStats, oldStatsBackup} = this.permuteStats(receiver);
		const sideEffects = this.displaySideEffects(oldStatsBackup, opponentStats, attackTranslationModule);

		const attackStatus = this.getAttackStatus(damageDealt, initialDamage);
		const chosenString = attackTranslationModule.getRandom(`actions.attacksResults.${attackStatus}`);
		return format(chosenString, {
			attack: Translations.getModule(`fightactions.${this.name}`, language)
				.get("name")
				.toLowerCase()
		}) + sideEffects + Translations.getModule("commands.fight", language).format("actions.damages", {
			damages: damageDealt
		});
	}

	/**
	 * Display the side effects of the attack
	 * @param oldStatsBackup
	 * @param opponentStats
	 * @param attackTranslationModule
	 * @private
	 */
	private displaySideEffects(oldStatsBackup: number[], opponentStats: number[], attackTranslationModule: TranslationModule) : string {
		let sideEffects;
		// then we need to display the stats changes
		if (oldStatsBackup[0] !== opponentStats[0]) {
			const percentage = Math.abs(Math.round((oldStatsBackup[0] - opponentStats[0]) / oldStatsBackup[0] * 100));
			sideEffects = attackTranslationModule.format("actions.sideEffects.attack", {
				adversary: FightConstants.TARGET.OPPONENT,
				operator: oldStatsBackup[0] > opponentStats[0] ? FightConstants.OPERATOR.MINUS : FightConstants.OPERATOR.PLUS,
				amount: percentage
			});
		}
		if (oldStatsBackup[1] !== opponentStats[1]) {
			const percentage = Math.abs(Math.round((oldStatsBackup[1] - opponentStats[1]) / oldStatsBackup[1] * 100));
			sideEffects += attackTranslationModule.format("actions.sideEffects.defense", {
				adversary: FightConstants.TARGET.OPPONENT,
				operator: oldStatsBackup[1] > opponentStats[1] ? FightConstants.OPERATOR.MINUS : FightConstants.OPERATOR.PLUS,
				amount: percentage
			});
		}
		if (oldStatsBackup[2] !== opponentStats[2]) {
			const percentage = Math.abs(Math.round((oldStatsBackup[2] - opponentStats[2]) / oldStatsBackup[2] * 100));
			sideEffects += attackTranslationModule.format("actions.sideEffects.speed", {
				adversary: FightConstants.TARGET.OPPONENT,
				operator: oldStatsBackup[2] > opponentStats[2] ? FightConstants.OPERATOR.MINUS : FightConstants.OPERATOR.PLUS,
				amount: percentage
			});
		}
		return sideEffects;
	}

	/**
	 * Permute the best stat of the opponent with the worst stat
	 * @param receiver
	 * @private
	 */
	private permuteStats(receiver: Fighter) : {opponentStats: number[], oldStatsBackup: number[]} {
		const opponentStats = [receiver.stats.attack, receiver.stats.defense, receiver.stats.speed];
		const oldStatsBackup = [...opponentStats];
		const bestStat = Math.max(...opponentStats);
		const worstStat = Math.min(...opponentStats);
		const bestStatIndex = opponentStats.indexOf(bestStat);
		const worstStatIndex = opponentStats.indexOf(worstStat);
		opponentStats[bestStatIndex] = worstStat;
		opponentStats[worstStatIndex] = bestStat;
		[receiver.stats.attack, receiver.stats.defense, receiver.stats.speed] = opponentStats;
		return {opponentStats, oldStatsBackup};
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 55, averageDamage: 110, maxDamage: 130};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.attack,
				sender.stats.speed
			], defenderStats: [
				receiver.stats.defense,
				receiver.stats.speed
			], statsEffect: [
				0.8,
				0.2
			]
		};
	}
}