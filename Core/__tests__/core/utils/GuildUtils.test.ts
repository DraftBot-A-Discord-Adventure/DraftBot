import { describe, it, expect } from 'vitest';
import { GuildUtils } from '../../../src/core/utils/GuildUtils';
import { GuildConstants } from '../../../../Lib/src/constants/GuildConstants';

describe('GuildUtils.calculateAmountOfXPToAdd', () => {
	it('should return XP within expected range for a given cost', () => {
		const cost = 3000;
		const step = GuildConstants.XP_CALCULATION_STEP;
		const minXPPerStep = Math.floor(step / GuildConstants.XP_DIVIDER.MIN);
		const maxXPPerStep = Math.floor(step / GuildConstants.XP_DIVIDER.MAX);

		const fullSteps = Math.floor(cost / step);
		const remainder = cost % step;

		const minTotalXP = fullSteps * minXPPerStep + Math.floor(remainder / GuildConstants.XP_DIVIDER.MIN);
		const maxTotalXP = fullSteps * maxXPPerStep + Math.floor(remainder / GuildConstants.XP_DIVIDER.MAX);

		const xp = GuildUtils.calculateAmountOfXPToAdd(cost);

		expect(xp).toBeGreaterThanOrEqual(minTotalXP);
		expect(xp).toBeLessThanOrEqual(maxTotalXP);
	});
});