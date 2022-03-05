import {IMission} from "../IMission";
import {MissionDifficulty} from "../MissionDifficulty";
import {RandomUtils} from "../../utils/RandomUtils";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: any }): boolean {
		return params.travelTime >= variant;
	},

	getVariantFormatVariable(variant: number): Promise<string> {
		return Promise.resolve(Promise.resolve(variant.toString()));
	},

	generateRandomVariant(difficulty: MissionDifficulty): Promise<number> {
		switch (difficulty) {
		case MissionDifficulty.MEDIUM:
			return Promise.resolve(RandomUtils.draftbotRandom.integer(5, 7));
		case MissionDifficulty.HARD:
			return Promise.resolve(9);
		default:
			return Promise.resolve(RandomUtils.draftbotRandom.integer(2, 3));
		}
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};