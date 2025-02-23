import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightHistoryItemPacket extends DraftBotPacket {
	fighterKeycloakId?: string;

	monsterId?: string;

	fightActionId!: string;

	status?: string; // See constants in FightActionStatus

	damageDealt?: number; // Will be negative if we are healing the opponent

	damageReceived?: number; // Will be negative if the player is healed

	statsChangeDealt?: { // Stat change for the opponent in % (10 = 10%) can be negative
		defense?: number;
		attack?: number;
		speed?: number;
		breath?: number; // This one is not in %
	};

	statsChangeReceived?: { // Stat change for the fighter in % (10 = 10%) can be negative
		defense?: number;
		attack?: number;
		speed?: number;
		breath?: number; // This one is not in %
	};
}