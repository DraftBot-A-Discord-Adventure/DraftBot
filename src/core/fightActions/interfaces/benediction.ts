import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/fighter/Fighter";
import {Translations} from "../../Translations";
import {format} from "../../utils/StringFormatter";
import {Data} from "../../Data";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../constants/FightConstants";
import {FightController} from "../../fights/FightController";
import {PlayerFighter} from "../../fights/fighter/PlayerFighter";

type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };
type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

export const fightActionInterface: IFightAction = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// check the amount of ultimate attacks the sender already used
		const usedGodMoovs = FightController.getUsedGodMoves(sender, receiver);

		// 1 god move per fight
		if (usedGodMoovs >= 1) {
			return attackTranslationModule.format("actions.attacksResults.maxUses", {
				attack: Translations.getModule(`fightactions.${this.getName()}`, language)
					.get("name")
					.toLowerCase()
			});
		}

		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 10);

		receiver.stats.fightPoints -= damageDealt;
		let sideEffects = "";
		const buff = turn < 15 ? Math.round(1.67 * turn) : 25;

		sender.stats.defense = Math.round(sender.stats.defense + sender.stats.defense * buff / 100);
		sideEffects += attackTranslationModule.format("actions.sideEffects.defense", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.PLUS,
			amount: buff
		});
		sender.stats.attack = Math.round(sender.stats.attack + sender.stats.attack * buff / 100);
		sideEffects += attackTranslationModule.format("actions.sideEffects.attack", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.PLUS,
			amount: buff
		});
		sender.stats.speed = Math.round(sender.stats.speed - sender.stats.speed * buff / 100);
		sideEffects += attackTranslationModule.format("actions.sideEffects.speed", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.PLUS,
			amount: buff
		});


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
		return "benediction";
	},

	getAttackInfo(): attackInfo {
		return {minDamage: 55, averageDamage: 100, maxDamage: 200};
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