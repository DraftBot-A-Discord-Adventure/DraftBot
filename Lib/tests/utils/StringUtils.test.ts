import { describe, it, expect } from 'vitest';
import {StringConstants} from "../../src/constants/StringConstants";
import {progressBar} from "../../src/utils/StringUtils";

describe('progressBar', () => {
	// Fonction d'aide pour générer la sortie attendue basée sur la taille réelle
	function expectedProgressBar(percentage: number): string {
		const progress = Math.round(StringConstants.PROGRESS_BAR_SIZE * percentage / 100);
		const empty = StringConstants.PROGRESS_BAR_SIZE - progress;
		return `\`\`\`[${
			"▇".repeat(progress)}${
			"—".repeat(empty)}]${
			Math.floor(percentage)}%\`\`\``;
	}

	it('should create a 50% progress bar correctly', () => {
		const result = progressBar(50, 100);
		expect(result).toBe(expectedProgressBar(50));
	});

	it('should create a 100% progress bar correctly', () => {
		const result = progressBar(100, 100);
		expect(result).toBe(expectedProgressBar(100));
	});

	it('should create a 0% progress bar correctly', () => {
		const result = progressBar(0, 100);
		expect(result).toBe(expectedProgressBar(0));
	});

	it('should handle negative values by setting progress to 0%', () => {
		const result = progressBar(-50, 100);
		expect(result).toBe(expectedProgressBar(0));
	});

	it('should handle NaN values by setting progress to 0%', () => {
		const result = progressBar(NaN, 100);
		expect(result).toBe(expectedProgressBar(0));
	});

	it('should handle Infinity values by setting progress to 0%', () => {
		const result = progressBar(Infinity, 100);
		expect(result).toBe(expectedProgressBar(0));
	});

	it('should cap progress at 100% when value exceeds maxValue', () => {
		const result = progressBar(150, 100);
		expect(result).toBe(expectedProgressBar(100));
	});

	it('should handle decimal values correctly', () => {
		const result = progressBar(33.33, 100);
		// La fonction progressBar() arrondit à 33%
		expect(result).toBe(expectedProgressBar(33));
	});
});