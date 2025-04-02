import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightEndOfFightPacket extends DraftBotPacket {
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

	draw!: boolean;

	turns!: number;

	maxTurns!: number;
}
