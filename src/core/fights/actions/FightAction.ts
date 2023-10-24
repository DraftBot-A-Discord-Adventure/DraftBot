import {Fighter} from "../fighter/Fighter";
import {FightActionType} from "@Lib/src/interfaces/FightActionType";
import {FightActionStatus} from "@Lib/src/interfaces/FightActionStatus";
import {FightWeather} from "../FightWeather";
import {FightConstants} from "../../constants/FightConstants";
import {IFightAction} from "../../../../../Lib/src/interfaces/IFightAction";
import {Data} from "../../../data/Data";

export type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };
export type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

export abstract class FightAction extends Data<string> implements IFightAction {
	public readonly emoji: string;

	public readonly breath: number;

	public readonly missionVariant: number;

	public readonly type: FightActionType;

	public isAlteration = false;

	private toStringCache: { [key: string]: string } = {};

	private weightForRandomSelection: number;

	/**
	 * Use the action the sender chose
	 * @param sender - the one who does the action
	 * @param receiver - the one who undergo the action
	 * @param turn - the turn's number
	 * @param language - the language of the message
	 * @param weather - current weather of the fight
	 */
	abstract use(sender: Fighter, receiver: Fighter, turn: number, language: string, weather: FightWeather): string | Promise<string>;

	/**
	 * Return the weight of the action for random selection
	 */
	public getWeightForRandomSelection(): number {
		return this.weightForRandomSelection ?? FightConstants.DEFAULT_ACTION_WEIGHT;
	}


	/**
	 * Set the weight of the action for random selection
	 * @param weight
	 */
	public setWeightForRandomSelection(weight: number): void {
		this.weightForRandomSelection = weight;
	}

	/**
	 * Return the amount of breath the action cost
	 */
	public getBreathCost(): number {
		if (!this.breathCostCache) {
			this.breathCostCache = Data.getModule(`fightactions.${this.name}`)
				.getNumber("breath");
		}
		return this.breathCostCache;
	}

	public getType(): FightActionType {
		if (!this.typeCache) {
			this.typeCache = FightActionType[Data.getModule(`fightactions.${this.name}`)
				.getString("type")
				.toUpperCase() as keyof typeof FightActionType];
		}
		return this.typeCache;
	}

	/**
	 * Get the generic attack output message
	 * @param damageDealt
	 * @param initialDamage
	 * @param language
	 * @param sideEffects Additional effects to output
	 */
	public getGenericAttackOutput(damageDealt: number, initialDamage: number, language: string, sideEffects = ""): string {
		const attackTranslationModule = Translations.getModule("commands.fight", language);
		const attackStatus = this.getAttackStatus(damageDealt, initialDamage);
		const chosenString = attackTranslationModule.getRandom(`actions.attacksResults.${attackStatus}`);
		return format(chosenString, {
			attack: Translations.getModule(`fightactions.${this.name}`, language)
				.get("name")
				.toLowerCase()
		}) + sideEffects + Translations.getModule("commands.fight", language)
			.format("actions.damages", {
				damages: damageDealt
			});
	}

	/**
	 * Return the status of the attack (success, missed, critical)
	 */
	protected getAttackStatus(damageDealt: number, initialDamage: number): FightActionStatus {
		return damageDealt > initialDamage
			? FightActionStatus.CRITICAL
			: damageDealt < initialDamage
				? FightActionStatus.MISSED
				: FightActionStatus.NORMAL;
	}

}