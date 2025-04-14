import { NotificationPacket } from "./NotificationPacket";
import { CommandGuildDailyRewardPacket } from "../commands/CommandGuildDailyPacket";

export class GuildDailyNotificationPacket extends NotificationPacket {
	keycloakIdOfExecutor!: string;

	reward!: CommandGuildDailyRewardPacket;
}
