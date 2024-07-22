import {SmallEventPacket} from "./SmallEventPacket";

export class SmallEventLeagueRewardPacket extends SmallEventPacket {
	rewardToday!: boolean;

	leagueId!: number;

	money!: number;

	xp!: number;

	nextRewardDate!: number;

	enoughFights!: boolean;
}