import {TranslationModule} from "../../Translations";
import {FighterStatus} from "../FighterStatus";
import {FightView} from "../FightView";
import {FightAction} from "../actions/FightAction";
import {RandomUtils} from "../../utils/RandomUtils";
import {FightAlteration} from "../actions/FightAlteration";
import Class from "../../database/game/models/Class";

type FighterStats = {
	fightPoints: number,
	maxFightPoint: number,
	speed: number,
	defense: number,
	attack: number,
	breath: number,
	maxBreath: number,
	breathRegen: number,
	glory: number
}

export enum FightStatModifierOperation {
	ADDITION,
	MULTIPLIER,
	SET_VALUE
}

export type FightStatModifier = {
	origin: FightAction,
	operation: FightStatModifierOperation,
	value: number
}

type FightDamageMultiplier = {
	value: number,
	turns: number
}

const fighterStatusTranslation = [
	"summarize.notStarted",
	"summarize.attacker",
	"summarize.defender",
	"summarize.bug"
];

/**
 * @class Fighter
 */
export abstract class Fighter {
	protected stats: FighterStats;

	public nextFightAction: FightAction;

	public fightActionsHistory: FightAction[];

	public availableFightActions: Map<string, FightAction>;

	public alterationTurn: number;

	public readonly level: number;

	private attackModifiers: FightStatModifier[];

	private defenseModifiers: FightStatModifier[];

	private speedModifiers: FightStatModifier[];

	private ready: boolean;

	public alteration: FightAction;

	protected status: FighterStatus;

	protected class: Class;

	private damageMultiplier: FightDamageMultiplier;

	protected constructor(level: number, availableFightActions: FightAction[]) {
		this.stats = {
			fightPoints: null,
			maxFightPoint: null,
			speed: null,
			defense: null,
			attack: null,
			breath: null,
			maxBreath: null,
			breathRegen: null,
			glory: null
		};
		this.attackModifiers = [];
		this.defenseModifiers = [];
		this.speedModifiers = [];
		this.ready = false;
		this.nextFightAction = null;
		this.fightActionsHistory = [];
		this.status = FighterStatus.NOT_STARTED;
		this.alteration = null;
		this.alterationTurn = 0;
		this.level = level;
		this.damageMultiplier = null;

		this.availableFightActions = new Map();
		for (const fightAction of availableFightActions) {
			this.availableFightActions.set(fightAction.name, fightAction);
		}
	}

	/**
	 * get the string referring to the fighter name
	 * @public
	 */
	abstract getName(): string;

	/**
	 * get the mention of a fighter
	 */
	abstract getMention(): string;

	/**
	 * Make the fighter choose his next action
	 * @param fightView
	 */
	abstract chooseAction(fightView: FightView): void;

	/**
	 * Function called when the fight starts
	 */
	abstract startFight(fightView: FightView, startStatus: FighterStatus.ATTACKER | FighterStatus.DEFENDER): Promise<void>;

	/**
	 * Function called when the fight ends
	 * @param fightView
	 * @param winner Indicate if the fighter is the winner
	 */
	abstract endFight(fightView: FightView, winner: boolean): Promise<void>;

	/**
	 * Allow the fighter to unblock himself
	 */
	abstract unblock(): void;

	/**
	 * set the status of the fighter
	 * @param newStatus
	 */
	setStatus(newStatus: FighterStatus): void {
		this.status = newStatus;
	}

	private calculateModifiedStat(base: number, modifiers: FightStatModifier[]): number {
		let value = base;
		for (const modifier of modifiers) {
			switch (modifier.operation) {
			case FightStatModifierOperation.ADDITION:
				value += modifier.value;
				break;
			case FightStatModifierOperation.MULTIPLIER:
				value *= modifier.value;
				break;
			case FightStatModifierOperation.SET_VALUE:
				value = modifier.value;
				return Math.round(value);
			default:
				break;
			}
		}

		return Math.round(value);
	}

	/**
	 * Get fighter attack
	 */
	public getAttack(): number {
		return this.calculateModifiedStat(this.stats.attack, this.attackModifiers);
	}

	/**
	 * Get fighter defense
	 */
	public getDefense(): number {
		return this.calculateModifiedStat(this.stats.defense, this.defenseModifiers);
	}

	/**
	 * Get fighter speed
	 */
	public getSpeed(): number {
		return this.calculateModifiedStat(this.stats.speed, this.speedModifiers);
	}

	/**
	 * Get fight points
	 */
	public getFightPoints(): number {
		return this.stats.fightPoints;
	}

	/**
	 * Get the maximum fight points
	 */
	public getMaxFightPoints(): number {
		return this.stats.maxFightPoint;
	}

	/**
	 * Get the breath of the fighter
	 */
	public getBreath(): number {
		return this.stats.breath;
	}

	/**
	 * Get the maximum breath of the fighter
	 */
	public getMaxBreath(): number {
		return this.stats.maxBreath;
	}

	/**
	 * Get the regen breath of the fighter
	 */
	public getRegenBreath(): number {
		return this.stats.breathRegen;
	}

	/**
	 * Add (or remove if negative) breath to the fighter
	 * @param value The new breath
	 */
	public addBreath(value: number): number {
		this.stats.breath += value;
		if (this.stats.breath < 0) {
			this.stats.breath = 0;
		}
		else if (this.stats.breath > this.stats.maxBreath) {
			this.stats.breath = this.stats.maxBreath;
		}
		return this.stats.breath;
	}

	/**
	 *Set the breath of the fighter
	 * @param value The new breath
	 */
	public setBreath(value: number): void {
		this.stats.breath = value;
	}

	/**
	 * Set the base fight points
	 * @param value
	 */
	public setBaseFightPoints(value: number): void {
		this.stats.fightPoints = value;
	}

	/**
	 * Apply an attack modifier
	 * @param modifier
	 */
	public applyAttackModifier(modifier: FightStatModifier): void {
		this.attackModifiers.push(modifier);
	}

	/**
	 * Apply a defense modifier
	 * @param modifier
	 */
	public applyDefenseModifier(modifier: FightStatModifier): void {
		this.defenseModifiers.push(modifier);
	}

	/**
	 * Apply a speed modifier
	 * @param modifier
	 */
	public applySpeedModifier(modifier: FightStatModifier): void {
		this.speedModifiers.push(modifier);
	}

	/**
	 * Remove all attack modifiers for an origin
	 * @param origin
	 */
	public removeAttackModifiers(origin: FightAction): void {
		this.attackModifiers = this.attackModifiers.filter((modifier) => modifier.origin !== origin);
	}

	/**
	 * Remove all defense modifiers for an origin
	 * @param origin
	 */
	public removeDefenseModifiers(origin: FightAction): void {
		this.defenseModifiers = this.defenseModifiers.filter((modifier) => modifier.origin !== origin);
	}

	/**
	 * Remove all speed modifiers for an origin
	 * @param origin
	 */
	public removeSpeedModifiers(origin: FightAction): void {
		this.speedModifiers = this.speedModifiers.filter((modifier) => modifier.origin !== origin);
	}

	/**
	 * Check if the fighter has an attack modifier with an origin
	 * @param origin
	 */
	public hasAttackModifier(origin: FightAction): boolean {
		return this.attackModifiers.filter((modifier) => modifier.origin === origin).length !== 0;
	}

	/**
	 * Check if the fighter has a defense modifier with an origin
	 * @param origin
	 */
	public hasDefenseModifier(origin: FightAction): boolean {
		return this.defenseModifiers.filter((modifier) => modifier.origin === origin).length !== 0;
	}

	/**
	 * Check if the fighter has a speed modifier with an origin
	 * @param origin
	 */
	public hasSpeedModifier(origin: FightAction): boolean {
		return this.speedModifiers.filter((modifier) => modifier.origin === origin).length !== 0;
	}

	/**
	 * Apply a multiplier which multiply the total damages of the fighter
	 * @param multiplier
	 * @param turns The number of turn it lasts
	 */
	public applyDamageMultiplier(multiplier: number, turns: number): void {
		this.damageMultiplier = {
			value: multiplier,
			turns
		};
	}

	/**
	 * Get the damage multiplier
	 */
	public getDamageMultiplier(): number {
		if (this.damageMultiplier) {
			return this.damageMultiplier.value;
		}

		return 1;
	}

	/**
	 * Damage the fighter
	 * @param value
	 * @param keepAlive Prevent the fighter to die of these damages
	 * @return The new value of energy
	 */
	public damage(value: number, keepAlive = false): number {
		this.stats.fightPoints -= value;
		if (this.stats.fightPoints < 0) {
			this.stats.fightPoints = 0;
		}
		if (keepAlive && this.stats.fightPoints === 0) {
			this.stats.fightPoints = 1;
		}
		return this.stats.fightPoints;
	}

	/**
	 * Heal the fighter
	 * @param value
	 * @return The new value of energy
	 */
	public heal(value: number): number {
		this.stats.fightPoints += value;
		const max = this.getMaxFightPoints();
		if (this.stats.fightPoints > max) {
			this.stats.fightPoints = max;
		}
		return this.stats.fightPoints;
	}

	/**
	 * Return a display of the player in a string format
	 * @param fightTranslationModule
	 */
	public getStringDisplay(fightTranslationModule: TranslationModule): string {
		return fightTranslationModule.format(
			fighterStatusTranslation[this.status],
			{
				pseudo: this.getName(),
				glory: this.stats.glory,
				class: this.class.getName(fightTranslationModule.language)
			}
		) + fightTranslationModule.format("summarize.stats", {
			power: this.getFightPoints(),
			attack: this.getAttack(),
			defense: this.getDefense(),
			speed: this.getSpeed(),
			breath: this.getBreath(),
			maxBreath: this.getMaxBreath(),
			breathRegen: this.getRegenBreath()
		});
	}

	/**
	 * check if the player is dead
	 */
	public isDead(): boolean {
		return this.getFightPoints() <= 0;
	}

	/**
	 * check if the player is dead or buggy
	 */
	public isDeadOrBug(): boolean {
		return this.isDead() || this.status === FighterStatus.BUG;
	}

	/**
	 * the name of the function is very clear
	 */
	public suicide(): void {
		this.stats.fightPoints = 0;
	}

	/**
	 * get a map of the fight actions executed and the amont of time it has been done
	 */
	public getFightActionCount(): Map<string, number> {
		const playerFightActionsHistory = new Map<string, number>();
		this.fightActionsHistory.forEach((action) => {
			if (playerFightActionsHistory.has(action.name)) {
				playerFightActionsHistory.set(action.name, playerFightActionsHistory.get(action.name) + 1);
			}
			else {
				playerFightActionsHistory.set(action.name, 1);
			}
		});
		return playerFightActionsHistory;
	}

	/**
	 * Check if the fighter has a fight alteration
	 */
	hasFightAlteration(): boolean {
		return this.alteration !== null;
	}

	/**
	 * Set a new fight alteration to the fighter
	 * @param alteration - the new fight alteration
	 * returns the FighterAlterationId of the fight alteration that was set or kept
	 */
	newAlteration(alteration: FightAlteration): FightAction {
		if (this.alteration === null || this.alteration === alteration) {
			this.alterationTurn = 0;
		}
		if (this.alteration === null || alteration === null) {
			// check for alteration conflict
			this.alteration = alteration;
		}
		return this.alteration;
	}

	/**
	 * Remove the player alteration
	 */
	removeAlteration(): void {
		this.alterationTurn = 0;
		this.alteration = null;
	}

	/**
	 * get a random fight action id from the list of available fight actions of the fighter
	 */
	getRandomAvailableFightAction(): FightAction {
		return RandomUtils.draftbotRandom.pick(Array.from(this.availableFightActions.values()));
	}

	/**
	 * Get the last fight action used by a fighter (excluding alteration)
	 */
	getLastFightActionUsed(): FightAction {
		const lastAction = this.fightActionsHistory[this.fightActionsHistory.length - 1];
		// we have to check that the last action is not a fight alteration
		if (lastAction && lastAction.isAlteration) {
			return this.fightActionsHistory[this.fightActionsHistory.length - 2];
		}
		return lastAction;
	}

	/**
	 * Remove the breathCost of a fight action from the fighter if possible. Returns true if the breath cost has been removed
	 * @param breathCost
	 */
	useBreath(breathCost: number): boolean {
		if (this.stats.breath >= breathCost) {
			this.stats.breath -= breathCost;
			return true;
		}
		return false;
	}

	/**
	 * Add the breathRegen of the fighter to its breath
	 * @param half - if true, the breath regeneration is divided by 2
	 */
	regenerateBreath(half : boolean): void {
		this.stats.breath += half ? Math.ceil(this.stats.breathRegen / 2) : this.stats.breathRegen;
		if (this.stats.breath > this.stats.maxBreath) {
			this.stats.breath = this.stats.maxBreath;
		}
	}

	/**
	 * Lowers the current counters by 1 turn
	 */
	reduceCounters(): void {
		if (this.damageMultiplier) {
			this.damageMultiplier.turns--;
			if (this.damageMultiplier.turns < 0) {
				this.damageMultiplier = null;
			}
		}
	}
}