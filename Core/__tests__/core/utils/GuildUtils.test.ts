import { describe, it, expect } from 'vitest';
import {GuildUtils} from "../../../src/core/utils/GuildUtils";

describe('GuildUtils', () => {
	describe('calculateAmountOfXPToAdd', () => {
		it('should return XP within expected range for a given cost', () => {
			expect(GuildUtils.calculateAmountOfXPToAdd(1000)).greaterThanOrEqual(50);
			expect(GuildUtils.calculateAmountOfXPToAdd(1000)).toBeLessThanOrEqual(450);
		});
	});
});