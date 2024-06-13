import {SmallEventPacket} from "./SmallEventPacket";

export class SmallEventLotteryNoAnswerPacket extends SmallEventPacket {}

export class SmallEventLotteryPoorPacket extends SmallEventPacket {}

export class SmallEventLotteryWinPacket extends SmallEventPacket {
	lostTime!: number;

	money?: number;

	points?: number;

	guildXp?: number;

	xp?: number;
}

export class SmallEventLotteryLosePacket extends SmallEventPacket {
	moneyLost!: number;

	lostTime!: number;
}