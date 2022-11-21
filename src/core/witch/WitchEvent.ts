import {TranslationModule, Translations} from "../Translations";
import {Data} from "../Data";
import {RandomUtils} from "../utils/RandomUtils";
import {CommandInteraction} from "discord.js";
import Player from "../database/game/models/Player";
import {NumberChangeReason} from "../constants/LogsConstants";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {GenericItemModel} from "../database/game/models/GenericItemModel";
import {format} from "../utils/StringFormatter";

export abstract class WitchEvent {
	public readonly name: string;

	public type: number;

	protected timePenalty = 0;

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
	 * Base function to get the amount of life points this witch event will remove
	 */
	protected getLifePointsRemovedAmount(): number {
		return SmallEventConstants.WITCH.BASE_LIFE_POINTS_REMOVED_AMOUNT;
	}

	/**
	 * remove life points from the player
	 * @param interaction
	 * @param player
	 * @param language
	 */
	public async removeLifePoints(interaction: CommandInteraction, player: Player, language: string): Promise<void> {
		await player.addHealth(
			this.getLifePointsRemovedAmount(),
			interaction.channel,
			language,
			NumberChangeReason.SMALL_EVENT
		);
	}

	/**
	 * return the name of the attack as it will appear in the list of actions
	 * @param language
	 * @param forceEndOfStringEmojiPlacement
	 */
	public toString(language: string, forceEndOfStringEmojiPlacement: boolean): string {
		return forceEndOfStringEmojiPlacement ?
			Translations.getModule("smallEvents.witch", language).get(`witchEventNames.${this.name}`) + " " + this.getEmoji()
			: this.getEmoji() + " " + Translations.getModule("smallEvents.witch", language).get(`witchEventNames.${this.name}`);
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
			potionProbability, effectProbability, lifePointLostProbability, nothingProbability
		];
	}

	/**
	 * return a string describing the outcome of the witch event
	 * @param outcome what will happen to the player
	 * @param translationModule
	 */
	public generateResultString(outcome: number, translationModule: TranslationModule): string {
		const introToLoad = this.type === SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT ? "witchEventResults.ingredientIntros" : "witchEventResults.adviceIntros";
		const timeOutro = this.forceEffect ?
			" " + format(translationModule.getRandom(`witchEventResults.outcomes.${SmallEventConstants.WITCH.OUTCOME_TYPE.EFFECT}.time`), {lostTime: this.timePenalty})
			: "";
		return format(translationModule.getRandom(introToLoad),
			{
				witchEvent: this.toString(translationModule.language, true).toLowerCase()
			}) + " " + format(translationModule.getRandom(`witchEventResults.outcomes.${outcome}`),
			{
				lifeLoss: this.getLifePointsRemovedAmount()
			}) + timeOutro;
	}
}