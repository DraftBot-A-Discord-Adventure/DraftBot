import {Translations} from "../Translations";
import {Data} from "../Data";
import {RandomUtils} from "../utils/RandomUtils";
import {Interaction} from "discord.js";
import Player from "../database/game/models/Player";
import {NumberChangeReason} from "../constants/LogsConstants";

export abstract class WitchEvent {
	public readonly name: string;

	public readonly type: number;

	private toStringCache: { [key: string]: string } = {};

	private emojiCache: string;

	private outcomeProbabilities: number[];

	public constructor(name: string) {
		this.name = name;
	}

	/**
	 * Generates the outcome
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

	abstract givePotion(interaction: Interaction, player: Player, language: string): Promise<void> ;

	abstract giveEffect(interaction: Interaction, player: Player, language: string): Promise<void>;

	public async removeLifePoints(interaction: Interaction, player: Player, language: string): Promise<void> {
		await player.addHealth(RandomUtils.randInt(3, 8), interaction.channel, language, NumberChangeReason.SMALL_EVENT);
	}

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
			this.emojiCache = Data.getModule(`ingredients.${this.name}`).getString("emote");
		}
		return this.emojiCache;
	}
}