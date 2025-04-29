import { describe, it, expect } from 'vitest';
import {MathUtils} from "../../../src/core/utils/MathUtils";

describe('MathUtils', () => {
	describe('getIntervalValue', () => {
		it('should correctly compute the interval value for a given percentage', () => {
			expect(MathUtils.getIntervalValue(0, 100, 0)).toBe(0);
			expect(MathUtils.getIntervalValue(0, 100, 0.5)).toBe(50);
			expect(MathUtils.getIntervalValue(0, 100, 1)).toBe(100);
		});

		it('should cap percentage below 0 to 0', () => {
			expect(MathUtils.getIntervalValue(10, 20, -0.5)).toBe(10);
		});

		it('should cap percentage above 1 to 1', () => {
			expect(MathUtils.getIntervalValue(10, 20, 1.5)).toBe(20);
		});

		it('should handle min greater than max', () => {
			expect(MathUtils.getIntervalValue(100, 0, 0.5)).toBe(50);
		});

		it('should handle decimal percentages', () => {
			expect(MathUtils.getIntervalValue(0, 200, 0.25)).toBe(50);
			expect(MathUtils.getIntervalValue(0, 200, 0.75)).toBe(150);
		});
	});
});
