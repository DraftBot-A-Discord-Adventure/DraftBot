import { NotificationPacket } from "./NotificationPacket";

export class PlayerFreedFromJailNotificationPacket extends NotificationPacket {
	/**
	 * The Keycloak ID of the player who performed the unlock action.
	 */
	freedByPlayerKeycloakId!: string;
}
