import {Fighter} from "../fights/Fighter";

type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };
type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

export type IFightAction = {
	/**
	 * Use the action the sender chose
	 * @param sender - the one who does the action
	 * @param receiver - the one who undergo the action
	 * @param language - the language of the message
	 */
	use(sender: Fighter, receiver: Fighter, language: string): string;

	/**
	 * return the name of the attack as it will appear in the list of actions
	 * @param language
	 */
	toString(language: string): string;

	/**
	 * return the emoji that is used to represent the action
	 */
	getEmoji(): string;

	/**
	 * return the id / name of the action
	 */
	getName(): string;

	/**
	 * return the damage information of the attack
	 */
	getAttackInfo(): attackInfo;

	/**
	 * return the statsInfo of the attack
	 */
	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo;

}