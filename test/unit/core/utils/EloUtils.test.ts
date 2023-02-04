import {EloGameResult, EloUtils} from "../../../../src/core/utils/EloUtils";

test("Elo test", () => {
	expect(EloUtils.calculateNewRating(1200, 1000, EloGameResult.WIN, 32))
		.toBe(1208);
	expect(EloUtils.calculateNewRating(1000, 1192, EloGameResult.LOSE, 32))
		.toBe(992);
	expect(EloUtils.calculateNewRating(1200, 1000, EloGameResult.DRAW, 32))
		.toBe(1192);
	expect(EloUtils.calculateNewRating(1000, 1200, EloGameResult.WIN, 32))
		.toBe(1024);
});