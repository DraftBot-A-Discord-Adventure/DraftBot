import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/Fighter";
import {Translations} from "../../Translations";
import {format} from "../../utils/StringFormatter";
import {Data} from "../../Data";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../constants/FightConstants";
import {FighterAlterationId} from "../../fights/FighterAlterationId";

type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };
type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

export const fightActionInterface: IFightAction = {
	use(sender: Fighter, receiver: Fighter, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.getPlayerLevel(), this.getAttackInfo());
		let damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 70);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		let sideEffects = "";

		// 75% chance to stun the defender
		if (Math.random() < 0.75) {
			const alteration = receiver.newAlteration(FighterAlterationId.STUNNED);
			if (alteration === FighterAlterationId.STUNNED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.OPPONENT,
					effect: attackTranslationModule.get("effects.stunned")
				});
			}
		}

		// sender has a 25% chance to be stunned and 75% chance to be hurt by his own attack
		if (Math.random() < 0.25) {
			const alteration = sender.newAlteration(FighterAlterationId.STUNNED);
			if (alteration === FighterAlterationId.STUNNED) {
				sideEffects += attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.SELF,
					effect: attackTranslationModule.get("effects.stunned")
				});
			}
		}
		else {
			const ownDamage = Math.round(damageDealt * 0.25);
			sender.stats.fightPoints -= ownDamage;
			sideEffects += attackTranslationModule.format("actions.sideEffects.damage", {
				amount: ownDamage
			});
		}

		damageDealt = Math.round(damageDealt);
		receiver.stats.fightPoints -= damageDealt;

		const attackStatus = this.getAttackStatus(damageDealt, initialDamage);
		const chosenString = attackTranslationModule.getRandom(`actions.attacksResults.${attackStatus}`);
		return format(chosenString, {
			attack: Translations.getModule("fightactions." + this.getName(), language)
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
		return "ramAttack";
	},

	getAttackInfo(): attackInfo {
		return {minDamage: 150, averageDamage: 175, maxDamage: 250};
	},

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.defense,
				sender.stats.agility
			], defenderStats: [
				receiver.stats.defense,
				receiver.stats.agility
			], statsEffect: [
				0.85,
				0.15
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