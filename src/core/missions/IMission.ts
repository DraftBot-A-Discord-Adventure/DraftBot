import {MissionDifficulty} from "./MissionDifficulty";

export type IMission = {
	generateRandomVariant(difficulty: MissionDifficulty): number;

	areParamsMatchingVariant(variant: number, params: { [key: string]: any }): boolean;

	getVariantFormatVariable(variant: number): string;
}