import {MissionDifficulty} from "./MissionDifficulty";
import Player from "../models/Player";

export type IMission = {
	generateRandomVariant(difficulty: MissionDifficulty): number;

	areParamsMatchingVariant(variant: number, params: { [key: string]: any }): boolean;

	getVariantFormatVariable(variant: number, language: string): Promise<string>;

	initialNumberDone(player: Player, variant: number): Promise<number>;
}