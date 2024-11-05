import {NotificationSerializedPacket} from "../../../Lib/src/packets/notifications/NotificationSerializedPacket";

export abstract class NotificationsHandler {
	static async sendNotification(notificationSerializedPacket: NotificationSerializedPacket): Promise<void> {
		console.log(`Received notification: ${JSON.stringify(notificationSerializedPacket)}`);
	}
}