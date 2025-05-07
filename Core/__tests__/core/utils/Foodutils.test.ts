import { describe, it, expect } from 'vitest';
import {FoodUtils} from "../../../src/core/utils/FoodUtils";

describe('FoodUtils', () => {
	describe('getFoodIndexOf', () => {
		it('should correctly compute the interval value for a given percentage', () => {
			expect(FoodUtils.getFoodIndexOf(commonFood)).toBe(0);
			expect(FoodUtils.getFoodIndexOf(carnivorousFood)).toBe(1);
			expect(FoodUtils.getFoodIndexOf(herbivorousFood)).toBe(2);
			expect(FoodUtils.getFoodIndexOf(ultimateFood)).toBe(3);
		});
	});
});
