import {DataControllerString} from "./DataController";
import {Data} from "./Data";
import {RandomUtils} from "../../../Lib/src/utils/RandomUtils";
import {PVEConstants} from "../../../Lib/src/constants/PVEConstants";

export class Monster extends Data<string> {
	public readonly emoji: string;

	public readonly baseEnergyValue: number;

	public readonly attackRatio: number;

	public readonly defenseRatio: number;

	public readonly speedRatio: number;

	public readonly breath: number;

	public readonly maxBreath: number;

	public readonly breathRegen: number;

	public readonly attacks: {
       id: string,
       minLevel: number,
       weight: number
    }[];

	public readonly maps: number[];


	/**
     * Get the rewards of the monster
     * @param level Monster's level
     */
	public getRewards(level: number): {
        money: number,
        xp: number,
        guildScore: number,
        guildXp: number
    } {
		let totalRatio = (this.baseEnergyValue + this.attackRatio + this.defenseRatio + this.speedRatio) / 10.0;
		totalRatio = RandomUtils.draftbotRandom.real(totalRatio * (1 - PVEConstants.FIGHT_REWARDS.TOTAL_RATIO_RANDOM_RANGE), totalRatio * (1 + PVEConstants.FIGHT_REWARDS.TOTAL_RATIO_RANDOM_RANGE));
		const rewardMultiplier = PVEConstants.FIGHT_REWARDS.LEVEL_MULTIPLIER.A * level + PVEConstants.FIGHT_REWARDS.LEVEL_MULTIPLIER.B;

		return {
			money: Math.round((PVEConstants.FIGHT_REWARDS.MONEY.A * totalRatio * totalRatio + PVEConstants.FIGHT_REWARDS.MONEY.B * totalRatio + PVEConstants.FIGHT_REWARDS.MONEY.C) * rewardMultiplier),
			xp: Math.round((PVEConstants.FIGHT_REWARDS.XP.A * totalRatio * totalRatio + PVEConstants.FIGHT_REWARDS.XP.B * totalRatio + PVEConstants.FIGHT_REWARDS.XP.C) * rewardMultiplier),
			guildScore: Math.round(PVEConstants.FIGHT_REWARDS.GUILD_SCORE_MULTIPLIER * totalRatio),
			guildXp: Math.round((PVEConstants.FIGHT_REWARDS.GUILD_XP.A * totalRatio * totalRatio + PVEConstants.FIGHT_REWARDS.GUILD_XP.B * totalRatio + PVEConstants.FIGHT_REWARDS.GUILD_XP.C)
                * rewardMultiplier)
		};
	}
}

export class MonsterDataController extends DataControllerString<Monster> {
	static readonly instance: MonsterDataController = new MonsterDataController("monsters");

	newInstance(): Monster {
		return new Monster();
	}

	public getRandomMonster(mapId = -1, seed = RandomUtils.draftbotRandom.integer(1, 9999)): Monster {
		let availableMonsters = this.getValuesArray();

		if (mapId !== -1) {
			availableMonsters = availableMonsters.filter((monster) => monster.maps.includes(mapId));
		}

		return availableMonsters[seed % availableMonsters.length];
	}
}