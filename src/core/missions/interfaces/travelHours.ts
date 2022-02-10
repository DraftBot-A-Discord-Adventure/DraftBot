import {IMission} from "../IMission";
import {MissionDifficulty} from "../MissionDifficulty";
import {RandomUtils} from "../../utils/RandomUtils";

export const missionInterface: IMission = {
	generateRandomVariant: (difficulty: MissionDifficulty) => {
		switch (difficulty) {
		case MissionDifficulty.MEDIUM:
			return RandomUtils.draftbotRandom.integer(5, 7);
		case MissionDifficulty.HARD:
			return 9;
		default:
			return RandomUtils.draftbotRandom.integer(2, 3);
		}
	},

	areParamsMatchingVariant: (variant: number, params: { [key: string]: any }) => params.travelTime >= variant,

	getVariantFormatVariable: (variant: number) => Promise.resolve(variant.toString()),

	initialNumberDone: () => Promise.resolve(0)
};