import { NotificationPacket } from "./NotificationPacket";
import { TopWeekRewardTierId } from "../../constants/TopWeekRewardConstants";

export class TopWeekRewardNotificationPacket extends NotificationPacket {
	tierId!: TopWeekRewardTierId;

	weeklyScore!: number;

	money!: number;

	gems!: number;
}
