import { DataControllerNumber } from "./DataController";
import { Data } from "./Data";
import { LeagueInfoConstants } from "../../../Lib/src/constants/LeagueInfoConstants";
import { GenericItem } from "./GenericItem";
import { generateRandomItem } from "../core/utils/ItemUtils";

export class League extends Data<number> {
	public readonly color: string;

	public readonly minGloryPoints: number;

	public readonly maxGloryPoints: number;

	public readonly emoji: string;


	/**
	 * Get the amount of money to award to the player
	 */
	public getMoneyToAward(): number {
		return LeagueInfoConstants.MONEY_TO_AWARD[this.id];
	}

	/**
	 * Get the amount of xp to award to the player
	 */
	public getXPToAward(): number {
		return LeagueInfoConstants.XP_TO_AWARD[this.id];
	}

	/**
	 * Get the random item a player will get depending on the rarities that are tied to the league id
	 */
	public generateRewardItem(): GenericItem {
		return generateRandomItem(
			null,
			LeagueInfoConstants.ITEM_MINIMAL_RARITY[this.id],
			LeagueInfoConstants.ITEM_MAXIMAL_RARITY[this.id]
		);
	}

	/**
	 * True if the player will lose glory points at the end of the season
	 */
	public hasPointsReset(): boolean {
		return this.minGloryPoints >= LeagueInfoConstants.GLORY_RESET_THRESHOLD;
	}

	/**
	 * Give the point lose at the reset of the league
	 * @param currentPoints
	 */
	public pointsLostAtReset(currentPoints: number): number {
		if (currentPoints < LeagueInfoConstants.GLORY_RESET_THRESHOLD) {
			return 0;
		}
		return Math.round((currentPoints - LeagueInfoConstants.GLORY_RESET_THRESHOLD) * LeagueInfoConstants.SEASON_END_LOSS_PERCENTAGE);
	}
}

export class LeagueDataController extends DataControllerNumber<League> {
	static readonly instance: LeagueDataController = new LeagueDataController("leagues");

	newInstance(): League {
		return new League();
	}

	/**
	 * Get the league by its emoji
	 * @param emoji
	 */
	public getByEmoji(emoji: string): League {
		return this.getValuesArray()
			.find(league => league.emoji === emoji);
	}

	/**
	 * Get the league by its glory
	 * @param gloryPoints
	 */
	public getByGlory(gloryPoints: number): League {
		return this.getValuesArray()
			.find(league => league.minGloryPoints <= gloryPoints
				&& league.maxGloryPoints >= gloryPoints);
	}
}
