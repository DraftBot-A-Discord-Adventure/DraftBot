import {WitchActionFuncs, WitchActionOutcomeType} from "../../../data/WitchAction";
import {MissionsController} from "../../missions/MissionsController";

export const witchSmallEvent: WitchActionFuncs = {
	checkMissions: async (player, outcome, response, tags) => {
		if (outcome === WitchActionOutcomeType.EFFECT) {
			await MissionsController.update(player, response, {
				missionId: tags[0],
				params: {tags}
			});
		}
	}
};
