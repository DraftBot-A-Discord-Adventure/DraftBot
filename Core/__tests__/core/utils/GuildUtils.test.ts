import { describe, it, expect } from 'vitest';
import {GuildUtils} from "../../../src/core/utils/GuildUtils";

describe('GuildUtils', () => {
	describe('calculateAmountOfXPToAddForStep', () => {
		it('should correctly compute the interval value for a given percentage', () => {
			expect(GuildUtils.calculateAmountOfXPToAdd(0, 100, 0)).toBe(0);
		});
	});
});
