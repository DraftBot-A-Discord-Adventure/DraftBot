import {MissionDifficulty} from "./MissionDifficulty";
import Player from "../models/Player";

export type IMission = {
	generateRandomVariant(difficulty: MissionDifficulty): Promise<number>;

	areParamsMatchingVariant(variant: number, params: { [key: string]: any }): boolean;

	getVariantFormatVariable(variant: number, objective: number, language: string): Promise<string>;

	initialNumberDone(player: Player, variant: number): Promise<number>;
}