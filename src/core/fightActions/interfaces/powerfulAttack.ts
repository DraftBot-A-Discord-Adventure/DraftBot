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
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.getPlayerLevel(), this.getAttackInfo());
		let damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 20);

		// check how many times the attack appears in the fight action history of the sender
		const count = sender.fightActionsHistory.filter(action => action === this.getName()).length;

		// if the attack is repeated more than 3 times, the damage dealt is reduced by 70%
		damageDealt *= count > 3 ? 0.3 : 1;

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		let sideEffects = "";

		// 20% chance to stun the sender and deal 50% more damage
		if (Math.random() < 0.2) {
			const alteration = sender.newAlteration(FighterAlterationId.STUNNED);
			if (alteration === FighterAlterationId.STUNNED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.SELF,
					effect: attackTranslationModule.get("effects.stunned").toLowerCase()
				});
				damageDealt *= 1.5;
			}
		}

		damageDealt = Math.round(damageDealt);
		receiver.stats.fightPoints -= damageDealt;

		// Reduce speed of the sender by 15 %
		const reductionAmont = 15;
		receiver.stats.speed = Math.round(receiver.stats.speed - receiver.stats.speed * reductionAmont / 100);
		sideEffects += attackTranslationModule.format("actions.sideEffects.speed", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.MINUS,
			amount: reductionAmont
		});

		return format(attackTranslationModule.getRandom(`actions.attacksResults.${this.getAttackStatus(damageDealt, initialDamage)}`), {
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
		return "powerfulAttack";
	},

	getAttackInfo(): attackInfo {
		return {minDamage: 50, averageDamage: 150, maxDamage: 250};
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