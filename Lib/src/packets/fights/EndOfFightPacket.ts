import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightEndOfFightPacket extends DraftBotPacket {
	fightBugged!: boolean;

	winner!: {
		keycloakId?: string;
		monsterId?: string;
		finalEnergy: number;
		maxEnergy: number;
	};

	looser!: {
		keycloakId?: string;
		monsterId?: string;
		finalEnergy: number;
		maxEnergy: number;
	};

	turns!: number;

	maxTurns!: number;
}