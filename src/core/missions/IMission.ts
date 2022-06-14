import {MissionDifficulty} from "./MissionDifficulty";
import Player from "../models/Player";

export type IMission = {

	/**
	 * generate a random variant of mission
	 * @param difficulty - the difficulty of the mission
	 */
	generateRandomVariant(difficulty: MissionDifficulty): Promise<number>;

	/**
	 * check if the params are matching the variant
	 * @param variant - the variant of the mission
	 * @param params - the params of the mission
	 * @param saveBlob - some binary data to save in the mission
	 */
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: any }, saveBlob: Buffer): boolean;

	/**
	 * get the format of the variant
	 * @param variant - the variant of the mission
	 * @param objective - the objective of the mission
	 * @param language - the language to use
	 * @param saveBlob - some binary data
	 */
	getVariantFormatVariable(variant: number, objective: number, language: string, saveBlob: Buffer): Promise<string>;

	/**
	 * get the advancement of the mission at the beginning of the mission (maybe the player has already done it)
	 * @param player - the player
	 * @param variant - the variant of the mission
	 */
	initialNumberDone(player: Player, variant: number): Promise<number>;

	/**
	 * Save data in the mission (for example the location the player has to travel to in a go to there mission)
	 * @param variant - the variant of the mission
	 * @param saveBlob - the binary data to save
	 * @param params - identical to the update of the mission
	 */
	updateSaveBlob(variant: number, saveBlob: Buffer, params: { [key: string]: any }): Promise<Buffer>;
}