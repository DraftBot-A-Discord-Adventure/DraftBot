import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class FightRewardPacket extends DraftBotPacket {
	points!: number;

	money!: number;

	player1!: {
		keycloakId: string;
		oldGlory: number;
		newGlory: number;
		oldLeagueId: number;
		newLeagueId: number;
	};

	player2!: {
		keycloakId: string;
		oldGlory: number;
		newGlory: number;
		oldLeagueId: number;
		newLeagueId: number;
	};

	draw!: boolean;
}
