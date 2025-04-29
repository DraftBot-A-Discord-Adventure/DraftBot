import { describe, it, expect } from 'vitest';
import { progressBar } from "../../src/utils/StringUtils";

describe('progressBar', () => {
	it('should create a 50% progress bar correctly', () => {
		const result = progressBar(50, 100);
		expect(result).toBe("```[▇▇▇▇▇▇▇▇▇▇——————————]50%```");
	});

	it('should create a 100% progress bar correctly', () => {
		const result = progressBar(100, 100);
		expect(result).toBe("```[▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇]100%```");
	});

	it('should create a 0% progress bar correctly', () => {
		const result = progressBar(0, 100);
		expect(result).toBe("```[————————————————————]0%```");
	});

	it('should handle negative values by setting progress to 0%', () => {
		const result = progressBar(-50, 100);
		expect(result).toBe("```[————————————————————]0%```");
	});

	it('should handle NaN values by setting progress to 0%', () => {
		const result = progressBar(NaN, 100);
		expect(result).toBe("```[————————————————————]0%```");
	});

	it('should handle Infinity values by setting progress to 0%', () => {
		const result = progressBar(Infinity, 100);
		expect(result).toBe("```[————————————————————]0%```");
	});

	it('should cap progress at 100% when value exceeds maxValue', () => {
		const result = progressBar(150, 100);
		expect(result).toBe("```[▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇]100%```");
	});

	it('should handle decimal values correctly', () => {
		const result = progressBar(33.33, 100);
		expect(result).toBe("```[▇▇▇▇▇▇▇—————————————]33%```");
	});
});