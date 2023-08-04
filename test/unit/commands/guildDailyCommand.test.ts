import {GuildDailyConstants} from "../../../src/core/constants/GuildDailyConstants";

test("Guild daily Rewards are set correctly", () => {
	const resultArray: number[] = [], expectedArray: number[] = [];
	for (const guildDailyReward of GuildDailyConstants.GUILD_CHANCES) {
		let sum = 0;
		for (const value of Object.values(guildDailyReward)) {
			sum += value;
		}
		resultArray.push(sum);
		expectedArray.push(1000);
	}
	expect(resultArray).toEqual(expectedArray);
});

test("All guild daily reward objects have the same amount of properties", () => {
	const expectedAmountOfProperties: number = Object.keys(GuildDailyConstants.GUILD_CHANCES[0]).length;
	for (const guildDailyReward of GuildDailyConstants.GUILD_CHANCES) {
		expect(Object.keys(guildDailyReward).length).toEqual(expectedAmountOfProperties);
	}
});

test( "Last guild daily reward object has 0 as a guild xp reward", () => {
	expect(GuildDailyConstants.GUILD_CHANCES[GuildDailyConstants.GUILD_CHANCES.length - 1].guildXP).toEqual(0);
});