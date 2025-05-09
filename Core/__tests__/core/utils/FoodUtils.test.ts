import { describe, it, expect } from 'vitest';
import {getFoodIndexOf } from "../../../src/core/utils/FoodUtils";

describe('FoodUtils', () => {
	describe('getFoodIndexOf', () => {
		it('should correctly index the type of food', () => {
			expect(getFoodIndexOf("commonFood")).toBe(0);
			expect(getFoodIndexOf("carnivorousFood")).toBe(1);
			expect(getFoodIndexOf("herbivorousFood")).toBe(2);
			expect(getFoodIndexOf("ultimateFood")).toBe(3);
		});
	});
});
