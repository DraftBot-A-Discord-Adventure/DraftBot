import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/fighter/Fighter";
import {Translations} from "../../Translations";
import {format} from "../../utils/StringFormatter";
import {Data} from "../../Data";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../constants/FightConstants";
import {FighterAlterationId} from "../../fights/FighterAlterationId";
import {PlayerFighter} from "../../fights/fighter/PlayerFighter";

type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };
type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

export const fightActionInterface: IFightAction = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		let damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 20);

		// this attack will do less damage if the opponent has low defense
		damageDealt *= receiver.stats.defense < sender.stats.defense / 3 ? 0.1 : 1;
		damageDealt = Math.round(damageDealt);
		const attackTranslationModule = Translations.getModule("commands.fight", language);
		receiver.stats.fightPoints -= damageDealt;
		let sideEffects = "";

		// 50% chance to stun the defender
		if (Math.random() < 0.5) {
			const alteration = receiver.newAlteration(FighterAlterationId.STUNNED);
			if (alteration === FighterAlterationId.STUNNED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.OPPONENT,
					effect: attackTranslationModule.get("effects.stunned").toLowerCase()
				});
			}
		}

		// Reduce defense of the receiver by 25 %
		const reductionAmont = 25;
		receiver.stats.defense = Math.round(receiver.stats.defense - receiver.stats.defense * reductionAmont / 100);
		sideEffects += attackTranslationModule.format("actions.sideEffects.defense", {
			adversary: FightConstants.TARGET.OPPONENT,
			operator: FightConstants.OPERATOR.MINUS,
			amount: reductionAmont
		});

		return format(attackTranslationModule.getRandom(`actions.attacksResults.${this.getAttackStatus(damageDealt, initialDamage)}`), {
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
		return "heavyAttack";
	},

	getAttackInfo(): attackInfo {
		return {minDamage: 40, averageDamage: 120, maxDamage: 200};
	},

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.attack,
				sender.stats.speed
			], defenderStats: [
				receiver.stats.defense,
				receiver.stats.speed
			], statsEffect: [
				0.7,
				0.3
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