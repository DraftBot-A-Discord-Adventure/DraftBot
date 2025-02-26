import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightHistoryItemPacket extends DraftBotPacket {
	fighterKeycloakId?: string;

	monsterId?: string;

	fightActionId!: string;

	status?: string; // See constants in FightAlterationResult or FightActionStatus for values

	fightActionEffectDealt?: { // Stat change for the opponent in % (10 = 10%) can be negative
		damages?: number;
		defense?: number;
		attack?: number;
		speed?: number;
		breath?: number; // This one is not in %
	};

	fightActionEffectReceived?: { // Stat change for the fighter in % (10 = 10%) can be negative
		damages?: number;
		defense?: number;
		attack?: number;
		speed?: number;
		breath?: number; // This one is not in %
	};
}