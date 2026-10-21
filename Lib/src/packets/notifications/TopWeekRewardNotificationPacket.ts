import { NotificationPacket } from "./NotificationPacket";

export class TopWeekRewardNotificationPacket extends NotificationPacket {
	leagueId!: number;

	weeklyScore!: number;

	money!: number;

	gems!: number;
}
