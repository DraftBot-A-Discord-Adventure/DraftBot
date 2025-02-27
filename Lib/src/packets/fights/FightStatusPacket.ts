import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightStatusPacket extends DraftBotPacket {
	numberOfTurn!: number;

	maxNumberOfTurn!: number;

	activeFighter!: {
		keycloakId?: string;
		monsterId?: string;
		glory?: number;
		stats: {
			power: number;
			attack: number;
			defense: number;
			speed: number;
			breath: number;
			maxBreath: number;
			breathRegen: number;
		}
	};

	defendingFighter!: {
		keycloakId?: string;
		monsterId?: string;
		glory?: number;
		stats: {
			power: number;
			attack: number;
			defense: number;
			speed: number;
			breath: number;
			maxBreath: number;
			breathRegen: number;
		}
	};
}