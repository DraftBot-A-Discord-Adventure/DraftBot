import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { EloGameResult } from "../../types/EloGameResult";

export type FightHistoryItem = {
	initiator: boolean;

	opponentKeycloakId: string;

	result: EloGameResult;

	glory: {
		initial: {
			me: number;
			opponent: number;
		};
		change: {
			me: number;
			opponent: number;
		};
		leaguesChanges: {
			me?: {
				oldLeague: number;
				newLeague: number;
			};
			opponent?: {
				oldLeague: number;
				newLeague: number;
			};
		};
	};

	classes: {
		me: number;
		opponent: number;
	};

	date: number;
};

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandFightHistoryPacketReq extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightHistoryPacketRes extends DraftBotPacket {
	history!: FightHistoryItem[];
}
