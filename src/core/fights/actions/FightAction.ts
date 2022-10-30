import {Fighter} from "../fighter/Fighter";
import {Translations} from "../../Translations";
import {Data} from "../../Data";
import {FightConstants} from "../../constants/FightConstants";

export type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };
export type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

export abstract class FightAction {
	public readonly name: string;

	private toStringCache: { [key: string]: string } = {};

	private emojiCache: string;

	public constructor(name: string) {
		this.name = name;
	}

	/**
	 * Use the action the sender chose
	 * @param sender - the one who does the action
	 * @param receiver - the one who undergo the action
	 * @param turn - the turn's number
	 * @param language - the language of the message
	 */
	abstract use(sender: Fighter, receiver: Fighter, turn: number, language: string): string;

	/**
	 * return the name of the attack as it will appear in the list of actions
	 * @param language
	 */
	public toString(language: string): string {
		if (!this.toStringCache[language]) {
			this.toStringCache[language] = Translations.getModule(`fightactions.${this.name}`, language).get("name");
		}
		return this.toStringCache[language];
	}

	/**
	 * return the emoji that is used to represent the action
	 */
	public getEmoji(): string {
		if (!this.emojiCache) {
			this.emojiCache = Data.getModule(`fightactions.${this.name}`).getString("emote");
		}
		return this.emojiCache;
	}

	/**
	 * return the status of the attack (success, missed, critical)
	 */
	protected getAttackStatus(damageDealt: number, initialDamage: number): string {
		return damageDealt > initialDamage
			? FightConstants.ATTACK_STATUS.CRITICAL
			: damageDealt < initialDamage
				? FightConstants.ATTACK_STATUS.MISSED
				: FightConstants.ATTACK_STATUS.NORMAL;
	}
}