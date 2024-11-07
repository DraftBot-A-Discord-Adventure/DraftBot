import {NotificationsSerializedPacket} from "../../../Lib/src/packets/notifications/NotificationsSerializedPacket";

export abstract class NotificationsHandler {
	static async sendNotifications(notificationSerializedPacket: NotificationsSerializedPacket): Promise<void> {
		console.log(`Received notifications: ${JSON.stringify(notificationSerializedPacket)}`);
		// todo
	}
}