import {MissionDifficulty} from "./MissionDifficulty";
import Player from "../database/game/models/Player";

export type IMission = {

	/**
	 * Generate a random variant of mission
	 * @param difficulty - the difficulty of the mission
	 * @param player - the player from which the mission is generated
	 */
	generateRandomVariant(difficulty: MissionDifficulty, player: Player): Promise<number>;

	/**
	 * Check if the params are matching the variant
	 * @param variant - the variant of the mission
	 * @param params - the params of the mission
	 * @param saveBlob - some binary data to save in the mission
	 */
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: unknown }, saveBlob: Buffer): boolean;

	/**
	 * Get the format of the variant
	 * @param variant - the variant of the mission
	 * @param objective - the objective of the mission
	 * @param language - the language to use
	 * @param saveBlob - some binary data
	 */
	getVariantFormatVariable(variant: number, objective: number, language: string, saveBlob: Buffer): Promise<string>;

	/**
	 * Get the advancement of the mission at the beginning of the mission (maybe the player has already done it)
	 * @param player - the player
	 * @param variant - the variant of the mission
	 */
	initialNumberDone(player: Player, variant: number): Promise<number>;

	/**
	 * Save data in the mission (for example the location the player has to travel to in a go there mission)
	 * @param variant - the variant of the mission
	 * @param saveBlob - the binary data to save
	 * @param params - identical to the update of the mission
	 */
	updateSaveBlob(variant: number, saveBlob: Buffer, params: { [key: string]: unknown }): Promise<Buffer>;
}