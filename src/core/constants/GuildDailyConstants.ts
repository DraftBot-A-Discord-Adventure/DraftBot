export abstract class GuildDailyConstants {

	static readonly REWARD_TYPES = {
		PERSONAL_XP: "personalXP",
		GUILD_XP: "guildXP",
		HOSPITAL: "hospital",
		MONEY: "money",
		BADGE: "badge",
		FULL_HEAL: "fullHeal",
		PARTIAL_HEAL: "partialHeal",
		ALTERATION: "alterationHeal",
		PET_FOOD: "petFood"
	};

	static readonly MINIMAL_XP = 20;

	static readonly MAXIMAL_XP = 80;

	static readonly XP_MULTIPLIER = 2;

	static readonly MINIMAL_MONEY = 10;

	static readonly MAXIMAL_MONEY = 300;

	static readonly MONEY_MULTIPLIER = 4;

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
			guildXP: 150,
			money: 350,
			badge: 0,
			fullHeal: 0,
			hospital: 0,
			partialHeal: 50,
			alterationHeal: 200,
			petFood: 250
		},
		{
			personalXP: 10,
			guildXP: 150,
			money: 350,
			badge: 0,
			fullHeal: 2,
			hospital: 10,
			partialHeal: 50,
			alterationHeal: 190,
			petFood: 238
		},
		{
			personalXP: 20,
			guildXP: 150,
			money: 530,
			badge: 0,
			fullHeal: 3,
			hospital: 20,
			partialHeal: 50,
			alterationHeal: 180,
			petFood: 227
		},
		{
			personalXP: 40,
			guildXP: 150,
			money: 350,
			badge: 0,
			fullHeal: 4,
			hospital: 30,
			partialHeal: 50,
			alterationHeal: 170,
			petFood: 206
		},
		{
			personalXP: 60,
			guildXP: 150,
			money: 350,
			badge: 0,
			fullHeal: 5,
			hospital: 40,
			partialHeal: 50,
			alterationHeal: 160,
			petFood: 185
		},
		{
			personalXP: 80,
			guildXP: 150,
			money: 350,
			badge: 10,
			fullHeal: 6,
			hospital: 50,
			partialHeal: 50,
			alterationHeal: 150,
			petFood: 154
		},
		{
			personalXP: 100,
			guildXP: 150,
			money: 350,
			badge: 10,
			fullHeal: 7,
			hospital: 60,
			partialHeal: 50,
			alterationHeal: 140,
			petFood: 133
		},
		{
			personalXP: 150,
			guildXP: 150,
			money: 350,
			badge: 10,
			fullHeal: 8,
			hospital: 70,
			partialHeal: 50,
			alterationHeal: 130,
			petFood: 82
		},
		{
			personalXP: 200,
			guildXP: 150,
			money: 350,
			badge: 10,
			fullHeal: 9,
			hospital: 80,
			partialHeal: 50,
			alterationHeal: 120,
			petFood: 31
		},
		{
			personalXP: 200,
			guildXP: 150,
			money: 350,
			badge: 10,
			fullHeal: 10,
			hospital: 100,
			partialHeal: 50,
			alterationHeal: 100,
			petFood: 30
		},
		{
			personalXP: 250,
			guildXP: 0,
			money: 350,
			badge: 10,
			fullHeal: 15,
			hospital: 150,
			partialHeal: 50,
			alterationHeal: 100,
			petFood: 25
		}
	];
}