import { describe, it, expect } from 'vitest';
import {PetUtils} from "../../../src/core/utils/PetUtils";

describe('PetUtils', () => {
	describe('getAgeCategory', () => {
		it('should get correct category for correct age', () => {
			expect(PetUtils.getAgeCategory(1)).toBe("ancestor");
		});
	});
});