import { describe, it, expect } from 'vitest';
import {EloUtils} from "../../../src/core/utils/EloUtils";

describe('MathUtils', () => {
    describe('getKFactor', () => {
        it('should return the correct K factor', () => {
            expect(EloUtils.getKFactor(1000)).toBe(32);
            expect(EloUtils.getKFactor(2200)).toBe(24);
            expect(EloUtils.getKFactor(2500)).toBe(16);
        });
    });
});
