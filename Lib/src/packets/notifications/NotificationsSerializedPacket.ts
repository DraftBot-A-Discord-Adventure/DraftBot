import { NotificationPacket } from "./NotificationPacket";

export interface NotificationsSerializedPacket {
	notifications: {
		type: string;

		packet: NotificationPacket;
	}[];
}
