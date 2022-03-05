import {MissionDifficulty} from "./MissionDifficulty";
import Player from "../models/Player";

export type IMission = {
	generateRandomVariant(difficulty: MissionDifficulty): Promise<number>;

	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: any }, saveBlob: Buffer): boolean;

	getVariantFormatVariable(variant: number, objective: number, language: string): Promise<string>;

	initialNumberDone(player: Player, variant: number): Promise<number>;

	updateSaveBlob(saveBlob: Buffer, params: { [key: string]: any }): Promise<Buffer>;
}