import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightHistoryItemPacket extends DraftBotPacket {
	fighterKeycloakId?: string;

	monsterId?: string;

	fightActionId!: string;

	// Contains the status of the alteration, is it new? is it removed?
	alterationStatus?: string; // See constants in FightAlterationResult for values

	// Contains the result of the action, did it succeed? was it a critical hit?
	status?: string; // See constants in FightActionStatus for values

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