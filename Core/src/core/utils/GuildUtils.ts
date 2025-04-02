import { RandomUtils } from "../../../../Lib/src/utils/RandomUtils";
import { GuildConstants } from "../../../../Lib/src/constants/GuildConstants";

export abstract class GuildUtils {
	/**
	 * Calculate the amount of xp the guild will receive from the price chosen by the user
	 * @param cost
	 */
	static calculateAmountOfXPToAdd(cost: number): number {
		/**
		 * Does the random for xp obtained from the step / the reminder
		 * @param cost
		 */
		function calculateAmountOfXPToAddForStep(cost: number): number {
			return RandomUtils.randInt(
				Math.floor(cost / GuildConstants.XP_DIVIDER.MIN),
				Math.floor(cost / GuildConstants.XP_DIVIDER.MAX) + 1
			);
		}

		let guildExp = 0;
		for (let i = 0; i < Math.floor(cost / GuildConstants.XP_CALCULATION_STEP); i++) {
			guildExp += calculateAmountOfXPToAddForStep(GuildConstants.XP_CALCULATION_STEP);
		}

		return guildExp + calculateAmountOfXPToAddForStep(cost % GuildConstants.XP_CALCULATION_STEP);
	}
}
