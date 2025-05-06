import { describe, it, expect } from 'vitest';
import {PetUtils} from "../../../src/core/utils/PetUtils";

describe('PetUtils', () => {
	describe('getAgeCategory', () => {
		it('should get correct category for correct age', () => {
			expect(PetUtils.getAgeCategory(1)).toBe("ancestor");
			expect(PetUtils.getAgeCategory(500)).toBe("veryOld");
			expect(PetUtils.getAgeCategory(4000)).toBe("old");
			expect(PetUtils.getAgeCategory(10000)).toBe("adult");
			expect(PetUtils.getAgeCategory(30000)).toBe("other");
		});
	});
});