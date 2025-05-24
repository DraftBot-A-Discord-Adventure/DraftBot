import { NotificationPacket } from "./NotificationPacket";

export class FightChallengePacket extends NotificationPacket {
	/**
	 * The Keycloak ID of the player who attacked the player.
	 */
	attackedByPlayerKeycloakId!: string;
}
