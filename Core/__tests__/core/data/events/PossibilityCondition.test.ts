import {
	beforeEach, describe, expect, it, vi
} from "vitest";

const { getGoBackMapLink } = vi.hoisted(() => ({ getGoBackMapLink: vi.fn() }));

vi.mock("../../../../src/core/maps/Maps", () => ({
	Maps: { getGoBackMapLink }
}));

import { verifyPossibilityCondition } from "../../../../src/data/events/PossibilityCondition";
import type Player from "../../../../src/core/database/game/models/Player";

const player = { level: 1 } as Player;
const GO_BACK_LINK = { id: 58 };

describe("verifyPossibilityCondition canGoBack (#4844)", () => {
	beforeEach(() => {
		getGoBackMapLink.mockReset();
	});

	it.each([
		{
			canGoBack: true, linkAvailable: true, expected: true
		},
		{
			canGoBack: true, linkAvailable: false, expected: false
		},
		{
			canGoBack: false, linkAvailable: true, expected: false
		},
		{
			canGoBack: false, linkAvailable: false, expected: true
		}
	])("canGoBack $canGoBack with a U-turn available: $linkAvailable -> $expected", async ({
		canGoBack, linkAvailable, expected
	}) => {
		getGoBackMapLink.mockReturnValue(linkAvailable ? GO_BACK_LINK : null);

		await expect(verifyPossibilityCondition({ canGoBack }, player)).resolves.toBe(expected);
	});

	it("ignores the U-turn when the condition does not mention it", async () => {
		await expect(verifyPossibilityCondition({}, player)).resolves.toBe(true);
		expect(getGoBackMapLink).not.toHaveBeenCalled();
	});
});
