import { describe, it, expect } from 'vitest';
import {EloUtils} from "../../../src/core/utils/EloUtils";

describe('MathUtils', () => {
    describe('getKFactor', () => {
        it('should return the correct K factor', () => {
		const mockPlayer1 = { getGloryPoints: () => 1500 } as any;
		const mockPlayer2 = { getGloryPoints: () => 2200 } as any;
		const mockPlayer3 = { getGloryPoints: () => 2500 } as any;

		expect(EloUtils.getKFactor(mockPlayer1)).toBe(32);
		expect(EloUtils.getKFactor(mockPlayer2)).toBe(24);
		expect(EloUtils.getKFactor(mockPlayer3)).toBe(16);
        });
    });
});