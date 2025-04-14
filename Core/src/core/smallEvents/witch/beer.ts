import { WitchActionFuncs } from "../../../data/WitchAction";
import { MissionsController } from "../../missions/MissionsController";
import { WitchActionOutcomeType } from "../../../../../Lib/src/types/WitchActionOutcomeType";

export const witchSmallEvent: WitchActionFuncs = {
	checkMissions: async (player, outcome, response, tags) => {
		if (outcome === WitchActionOutcomeType.EFFECT) {
			await MissionsController.update(player, response, {
				missionId: tags[0],
				params: { tags }
			});
		}
	}
};
