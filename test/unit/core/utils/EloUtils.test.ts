import {EloGameResult, EloUtils} from "../../../../src/core/utils/EloUtils";

test("Elo test", () => {
	expect(EloUtils.calculateNewRating(1200, 1000, EloGameResult.WIN, 32))
		.toBe(1209);
	expect(EloUtils.calculateNewRating(1000, 1192, EloGameResult.LOSE, 32))
		.toBe(1000);
	expect(EloUtils.calculateNewRating(1200, 1000, EloGameResult.DRAW, 32))
		.toBe(1200);
	expect(EloUtils.calculateNewRating(899, 899, EloGameResult.DRAW, 32))
		.toBe(899);
	expect(EloUtils.calculateNewRating(1000, 1200, EloGameResult.WIN, 32))
		.toBe(1027);
});