import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/Fighter";
import {Translations} from "../../Translations";
import {format} from "../../utils/StringFormatter";
import {Data} from "../../Data";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../constants/FightConstants";
import {FighterAlterationId} from "../../fights/FighterAlterationId";
import {MathUtils} from "../../utils/MathUtils";

type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };
type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

export const fightActionInterface: IFightAction = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.getPlayerLevel(), this.getAttackInfo());

		// this attack will miss more if the opponent is fast
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 15, MathUtils.getIntervalValue(5, 35, (receiver.stats.speed + 20) / 320));

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		let sideEffects = "";

		// the receiver has a 15% chance to be slowed
		if (Math.random() < 0.15) {
			const alteration = receiver.newAlteration(FighterAlterationId.SLOWED);
			if (alteration === FighterAlterationId.SLOWED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.OPPONENT,
					effect: attackTranslationModule.get("effects.slowed").toLowerCase()
				});
			}
		}

		receiver.stats.fightPoints -= damageDealt;

		const attackStatus = this.getAttackStatus(damageDealt, initialDamage);
		const chosenString = attackTranslationModule.getRandom(`actions.attacksResults.${attackStatus}`);
		return format(chosenString, {
			attack: Translations.getModule(`fightactions.${this.getName()}`, language)
				.get("name")
				.toLowerCase()
		}) + sideEffects + Translations.getModule("commands.fight", language).format("actions.damages", {
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
		return "canonAttack";
	},

	getAttackInfo(): attackInfo {
		return {minDamage: 20, averageDamage: 120, maxDamage: 250};
	},

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.attack,
				120
			], defenderStats: [
				receiver.stats.defense,
				receiver.stats.speed
			], statsEffect: [
				0.5,
				0.5
			]
		};
	},

	getAttackStatus(damageDealt: number, initialDamage: number) {
		return damageDealt > initialDamage
			? FightConstants.ATTACK_STATUS.CRITICAL
			: damageDealt < initialDamage
				? FightConstants.ATTACK_STATUS.MISSED
				: FightConstants.ATTACK_STATUS.NORMAL;
	}
};