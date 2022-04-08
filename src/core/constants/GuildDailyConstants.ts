export abstract class GuildDailyConstants {

	static readonly MINIMAL_XP = 20;

	static readonly MAXIMAL_XP = 80;

	static readonly XP_MULTIPLIER = 2;

	static readonly MINIMAL_MONEY = 10;

	static readonly MAXIMAL_MONEY = 300;

	static readonly MONEY_MULTIPLIER = 4;

	static readonly FIXED_MONEY = 350;

	static readonly FIXED_PET_FOOD = 5;

	static readonly LEVEL_MULTIPLIER = 0.25;

	static readonly TIME_ADVANCED_MULTIPLIER = 0.05;

	static readonly TIME_BETWEEN_DAILIES = 22;

	static readonly SIZE_PALIER = 10;

	static readonly CHANCES_SUM = 1000;

	static readonly PET_DROP_CHANCE = 0.01;

	static readonly GUILD_CHANCES = [
		{
			personalXP: 0,
			guildXP: 0,
			money: 970,
			fixedMoney: 0,
			badge: 0,
			fullHeal: 0,
			hospital: 0,
			partialHeal: 0,
			alterationHeal: 30,
			petFood: 0
		},
		{
			personalXP: 50,
			guildXP: 250,
			money: 595,
			fixedMoney: 25,
			badge: 0,
			fullHeal: 2,
			hospital: 3,
			partialHeal: 50,
			alterationHeal: 20,
			petFood: 5
		},
		{
			personalXP: 50,
			guildXP: 250,
			money: 530,
			fixedMoney: 50,
			badge: 0,
			fullHeal: 3,
			hospital: 40,
			partialHeal: 52,
			alterationHeal: 20,
			petFood: 5
		},
		{
			personalXP: 50,
			guildXP: 250,
			money: 502,
			fixedMoney: 75,
			badge: 0,
			fullHeal: 4,
			hospital: 40,
			partialHeal: 54,
			alterationHeal: 20,
			petFood: 5
		},
		{
			personalXP: 100,
			guildXP: 250,
			money: 424,
			fixedMoney: 100,
			badge: 0,
			fullHeal: 5,
			hospital: 40,
			partialHeal: 56,
			alterationHeal: 20,
			petFood: 5
		},
		{
			personalXP: 100,
			guildXP: 250,
			money: 376,
			fixedMoney: 125,
			badge: 10,
			fullHeal: 6,
			hospital: 40,
			partialHeal: 58,
			alterationHeal: 25,
			petFood: 10
		},
		{
			personalXP: 100,
			guildXP: 250,
			money: 338,
			fixedMoney: 150,
			badge: 20,
			fullHeal: 7,
			hospital: 40,
			partialHeal: 60,
			alterationHeal: 25,
			petFood: 10
		},
		{
			personalXP: 100,
			guildXP: 250,
			money: 295,
			fixedMoney: 175,
			badge: 30,
			fullHeal: 8,
			hospital: 40,
			partialHeal: 62,
			alterationHeal: 30,
			petFood: 10
		},
		{
			personalXP: 150,
			guildXP: 250,
			money: 202,
			fixedMoney: 200,
			badge: 40,
			fullHeal: 9,
			hospital: 40,
			partialHeal: 64,
			alterationHeal: 35,
			petFood: 10
		},
		{
			personalXP: 150,
			guildXP: 250,
			money: 159,
			fixedMoney: 225,
			badge: 50,
			fullHeal: 10,
			hospital: 40,
			partialHeal: 66,
			alterationHeal: 40,
			petFood: 10
		},
		{
			personalXP: 200,
			guildXP: 0,
			money: 257,
			fixedMoney: 250,
			badge: 100,
			fullHeal: 15,
			hospital: 40,
			partialHeal: 68,
			alterationHeal: 60,
			petFood: 10
		}
	];
}