import {PossibilityCondition} from "./PossibilityCondition";
import {PossibilityOutcome} from "./PossibilityOutcome";

/**
 * A big event contains a set of possibilities which have a set of outcomes
 */
export class Possibility {
	/**
	 * Possibility emoji
	 */
	public readonly emoji: string;

	/**
	 * Possibility condition
	 */
	public readonly condition: PossibilityCondition;

	/**
	 * Possibility outcomes
	 */
	public readonly outcomes: PossibilityOutcome[];

	/**
	 * Possibility translations
	 */
	public readonly translations: { [language: string]: string };

	/**
	 * Possibility tags
	 */
	public readonly tags: string[];


	constructor(emoji: string, condition: PossibilityCondition, outcomes: PossibilityOutcome[], translations: { [language: string]: string }, tags: string[]) {
		this.emoji = emoji;
		this.condition = condition;
		this.outcomes = outcomes;
		this.translations = translations;
		this.tags = tags;
	}

	/**
	 * Get the text of the possibility
	 * @param language
	 */
	public getText(language: string): string {
		return this.translations[language];
	}
}