import {Translations} from "../Translations";
import {Data} from "../Data";
import {RandomUtils} from "../utils/RandomUtils";
import {CommandInteraction} from "discord.js";
import Player from "../database/game/models/Player";
import {NumberChangeReason} from "../constants/LogsConstants";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {GenericItemModel} from "../database/game/models/GenericItemModel";

export abstract class WitchEvent {
	public readonly name: string;

	public type: number;

	private toStringCache: { [key: string]: string } = {};

	private emojiCache: string;

	private outcomeProbabilities: number[];

	public forceEffect = false;

	protected constructor(name: string) {
		this.name = name;
	}

	/**
	 * Generates the outcome of the witch event
	 */
	public generateOutcome(): number {
		let seed = RandomUtils.randInt(1, 51);
		let outcome = SmallEventConstants.WITCH.OUTCOME_TYPE.BASE;
		do {
			seed -= this.outcomeProbabilities[outcome];
			outcome++;
		} while (seed > 0);
		return outcome;
	}

	/**
	 * generate a potion for the player each witch event will generate a different potion and will override this function
	 */
	public generatePotion(): Promise<GenericItemModel> {
		return null;
	}

	/**
	 * Base function to generate a give effect outcome, some witch events will override this
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public giveEffect(player: Player): Promise<void> | null {
		return null;
	}

	/**
	 * remove life points from the player
	 * @param interaction
	 * @param player
	 * @param language
	 */
	public async removeLifePoints(interaction: CommandInteraction, player: Player, language: string): Promise<void> {
		await player.addHealth(
			RandomUtils.randInt(
				SmallEventConstants.WITCH.MIN_LIFE_POINT_LOSS,
				SmallEventConstants.WITCH.MAX_LIFE_POINT_LOSS
			),
			interaction.channel,
			language,
			NumberChangeReason.SMALL_EVENT
		);
	}

	/**
	 * return the name of the attack as it will appear in the list of actions
	 * @param language
	 */
	public toString(language: string): string {
		if (!this.toStringCache[language]) {
			this.toStringCache[language] = this.getEmoji() + " " + Translations.getModule("smallEvents.witch", language).get(`witchEventNames.${this.name}`) + "\n";
		}
		return this.toStringCache[language];
	}

	/**
	 * return the emoji that is used to represent the action
	 */
	public getEmoji(): string {
		if (!this.emojiCache) {
			this.emojiCache = Data.getModule("smallEvents.witch").getString(`witchEventEmotes.${this.name}`);
		}
		return this.emojiCache;
	}

	/**
	 * generate an array of all the possible actions from clear probabilities
	 * @param potionProbability
	 * @param effectProbability
	 * @param lifePointLostProbability
	 * @param nothingProbability
	 */
	public setOutcomeProbabilities(potionProbability: number, effectProbability: number, lifePointLostProbability: number, nothingProbability: number): void {
		this.outcomeProbabilities = [
			potionProbability,
			potionProbability + effectProbability,
			potionProbability + effectProbability + lifePointLostProbability,
			potionProbability + effectProbability + lifePointLostProbability + nothingProbability
		];
	}
}