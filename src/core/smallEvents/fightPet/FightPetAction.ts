import {Translations} from "../../Translations";
import {Data} from "../../Data";
import {CommandInteraction} from "discord.js";
import Player from "../../database/game/models/Player";
/**
 * The base class for the different events that can happen after the player encounters a feral pet
 */
export abstract class FightPetAction {
	public readonly name: string;

	private emojiCache: string;

	public tags: string[] = []; // tags for mission completion

	public linkedPetId: number[] = []; // all the pet ids that have this action as one of their actions

	protected constructor(name: string) {
		this.name = name;
	}

	/**
	 * return the name of the attack as it will appear in the list of actions
	 * @param language
	 * @param forceEndOfStringEmojiPlacement
	 */
	public toString(language: string, forceEndOfStringEmojiPlacement: boolean): string {
		return forceEndOfStringEmojiPlacement ?
			`${Translations.getModule("smallEvents.fightPet", language).get(`fightPetActionNames.${this.name}`)} ${this.getEmoji()}`
			: `${this.getEmoji()} ${Translations.getModule("smallEvents.fightPet", language).get(`fightPetActionNames.${this.name}`)}`;
	}

	/**
	 * return the emoji that is used to represent the action
	 */
	public getEmoji(): string {
		this.emojiCache = this.emojiCache ?? Data.getModule("smallEvents.fightPet").getString(`fightPetActionEmotes.${this.name}`);
		return this.emojiCache;
	}

	/**
	 * check the mission validation for the fightPet event
	 * @param interaction
	 * @param player
	 * @param language
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async checkMissions(interaction: CommandInteraction, player: Player, language: string): Promise<void> {
		return await Promise.resolve();
	}

	/**
	 * return the array of all the ids of pet that have this action as one of their actions
	 */
	public getPetIds(): number[] {
		return this.linkedPetId;
	}
}