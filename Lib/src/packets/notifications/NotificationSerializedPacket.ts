import {NotificationPacket} from "./NotificationPacket";

export interface NotificationSerializedPacket {
	type: string;

	packet: NotificationPacket;
}