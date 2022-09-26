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
		let damageDealt = FightActionController.applySecondaryEffects(initialDamage, 10, 10);

		// Plus l'attaque est utilisée et plus elle est utilisée tard et moins elle est efficace. (pénalité maximale de -70 %)
		const ratio = (11 - turn * (sender.fightActionsHistory.filter(action => action === this.getName()).length + 1)) / 10;
		damageDealt = Math.round(ratio < 0.3 ? 0.3 * damageDealt : damageDealt * ratio);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		damageDealt = Math.round(damageDealt);
		receiver.stats.fightPoints -= damageDealt;

		return format(attackTranslationModule.getRandom(`actions.attacksResults.${this.getAttackStatus(damageDealt, initialDamage)}`), {
			attack: Translations.getModule("fightactions." + this.getName(), language)
				.get("name")
				.toLowerCase()
		}) + Translations.getModule("commands.fight", language).format("actions.damages", {
			damages: damageDealt
		});
	},

	toString(language: string): string {
		return Translations.getModule(`fightactions.${this.getName()}`, language).get("name");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "viciousAttack";
	},

	getAttackInfo(): attackInfo {
		return {minDamage: 50, averageDamage: 200, maxDamage: 350};
	},

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				300,
				sender.stats.attack,
				sender.stats.speed
			], defenderStats: [
				sender.stats.fightPoints,
				receiver.stats.defense,
				receiver.stats.speed
			], statsEffect: [
				0.6,
				0.2,
				0.2
			]
		};
	},

	getAttackStatus(damageDealt: number, initialDamage: number) {
		return damageDealt > initialDamage
			? FightConstants.ATTACK_STATUS.CRITICAL
			: damageDealt < initialDamage * 0.7
				? FightConstants.ATTACK_STATUS.MISSED
				: FightConstants.ATTACK_STATUS.NORMAL;
	}
};