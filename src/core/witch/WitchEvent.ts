import {Translations} from "../Translations";
import {Data} from "../Data";
import {RandomUtils} from "../utils/RandomUtils";
import {Interaction} from "discord.js";
import Player from "../database/game/models/Player";
import {NumberChangeReason} from "../constants/LogsConstants";
import Potion from "../database/game/models/Potion";
import {giveItemToPlayer} from "../utils/ItemUtils";
import {InventorySlots} from "../database/game/models/InventorySlot";
import {SmallEventConstants} from "../constants/SmallEventConstants";

export abstract class WitchEvent {
	public readonly name: string;

	public type: number;

	private toStringCache: { [key: string]: string } = {};

	private emojiCache: string;

	private outcomeProbabilities: number[];

	public constructor(name: string) {
		this.name = name;
	}

	/**
	 * Generates the outcome of the witch event
	 */
	public generateOutcome(): number {
		let seed = RandomUtils.randInt(1, 51);
		let outcome = 0;
		do {
			seed -= this.outcomeProbabilities[outcome];
			outcome++;
		} while (seed > 0);
		return outcome;
	}

	/**
	 * generate a potion for the player each witch event will generate a different potion and will override this function
	 */
	public generatePotion(): Promise<Potion> | null {
		return null;
	}

	/**
	 * give a potion to the player, the potion will be generated differently for each witch event
	 * @param interaction
	 * @param player
	 * @param language
	 */
	public async givePotion(interaction: Interaction, player: Player, language: string): Promise<void> {
		const potionToGive = await this.generatePotion();
		if (potionToGive) {
			await giveItemToPlayer(
				player,
				potionToGive,
				language,
				interaction.user,
				interaction.channel,
				await InventorySlots.getOfPlayer(player.id)
			);
		}
	}

	/**
	 * Base function to generate a give effect outcome, some witch events will override this
	 */
	public giveEffect(): Promise<void> | null {
		return null;
	}

	/**
	 * remove life points from the player
	 * @param interaction
	 * @param player
	 * @param language
	 */
	public async removeLifePoints(interaction: Interaction, player: Player, language: string): Promise<void> {
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
			this.toStringCache[language] = Translations.getModule(`smallEvents.witch.${this.name}`, language).get("name");
		}
		return this.toStringCache[language];
	}

	/**
	 * return the emoji that is used to represent the action
	 */
	public getEmoji(): string {
		if (!this.emojiCache) {
			this.emojiCache = Data.getModule(`smallEvents.witch.${this.name}`).getString("emote");
		}
		return this.emojiCache;
	}

	/**
	 * generate an array of all the possible actions from clear probabilities
	 * @param potionProbability
	 * @param timeLostProbability
	 * @param effectProbability
	 * @param lifePointLostProbability
	 * @param nothingProbability
	 */
	public setOutcomeProbabilities(potionProbability: number, timeLostProbability: number, effectProbability: number, lifePointLostProbability: number, nothingProbability: number): void {
		this.outcomeProbabilities = [
			potionProbability,
			potionProbability + timeLostProbability,
			potionProbability + timeLostProbability + effectProbability,
			potionProbability + timeLostProbability + effectProbability + lifePointLostProbability,
			potionProbability + timeLostProbability + effectProbability + lifePointLostProbability + nothingProbability
		];
	}
}