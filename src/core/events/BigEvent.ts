import {BigEventTrigger} from "./BigEventTrigger";
import {Possibility} from "./Possibility";
import Player from "../database/game/models/Player";
import {verifyPossibilityCondition} from "./PossibilityCondition";
import {Constants} from "../Constants";

export class BigEvent {
	/**
	 * The big event id
	 */
	public readonly id: number;

	/**
	 * The big event triggers
	 */
	public readonly triggers: BigEventTrigger[];

	/**
	 * The big event possibilities
	 */
	public readonly possibilities: Possibility[];

	/**
	 * The big event translations
	 */
	public readonly translations: { [language: string]: string };

	/**
	 * Map of reactions to possibilities
	 * @private
	 */
	private readonly possibilitiesMap: Map<string, Possibility>;

	/**
	 * Big event tags
	 */
	public readonly tags: string[];


	constructor(id: number, triggers: BigEventTrigger[], possibilities: Possibility[], translations: { [language: string]: string }, tags: string[]) {
		this.id = id;
		this.triggers = triggers;
		this.possibilities = possibilities;
		this.translations = translations;
		this.tags = tags;

		this.possibilitiesMap = new Map<string, Possibility>();
		for (const possibility of possibilities) {
			this.possibilitiesMap.set(possibility.emoji, possibility);
		}
	}

	/**
	 * Get the reactions and the possibilities text
	 * The possibilities condition are checked to choose to allow the possibility or not
	 * @param player
	 * @param language
	 */
	public async getReactionsAndText(player: Player, language: string): Promise<{
		text: string,
		reactions: string[]
	}> {
		let text = `${this.translations[language]}\n\n`;
		const reactions = [];
		for (const possibility of this.possibilities) {
			if (possibility.emoji !== "end" && (!possibility.condition || await verifyPossibilityCondition(possibility.condition, player))) {
				text += `${possibility.emoji} ${possibility.getText(language)}\n`;
				reactions.push(possibility.emoji);
			}
		}
		reactions.push(Constants.REACTIONS.NOT_REPLIED_REACTION);
		return {
			text,
			reactions
		};
	}

	/**
	 * Get a possibility instance from a reaction
	 * @param reaction
	 */
	public getPossibilityWithReaction(reaction: string): Possibility {
		return this.possibilitiesMap.get(reaction);
	}
}