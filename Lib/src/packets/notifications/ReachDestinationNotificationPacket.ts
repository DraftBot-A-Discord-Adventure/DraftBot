import { NotificationPacket } from "./NotificationPacket";

export class ReachDestinationNotificationPacket extends NotificationPacket {
	mapType!: string;

	mapId!: number;
}
