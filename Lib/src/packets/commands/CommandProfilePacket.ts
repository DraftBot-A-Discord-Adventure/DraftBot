import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { SexTypeShort } from "../../constants/StringConstants";
import { Badge } from "../../types/Badge";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandProfilePacketReq extends DraftBotPacket {
	askedPlayer!: {
		rank?: number;
		keycloakId?: string;
	};
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandProfilePlayerNotFound extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandProfilePacketRes extends DraftBotPacket {
	keycloakId!: string;

	playerData!: {
		stats?: {
			energy: {
				value: number;
				max: number;
			};
			attack: number;
			defense: number;
			speed: number;
			breath: {
				base: number;
				max: number;
				regen: number;
			};
		};
		missions: {
			gems: number;
			campaignProgression: number;
		};
		rank: {
			unranked: boolean;
			rank: number;
			numberOfPlayers: number;
			score: number;
		};
		effect: {
			healed: boolean;
			timeLeft: number;
			effect: string;
			hasTimeDisplay: boolean;
		};
		classId?: number;
		fightRanking?: {
			glory: number;
			league: number;
		};
		guild?: string;
		destinationId?: number;
		mapTypeId?: string;
		pet?: {
			typeId: number;
			sex: SexTypeShort;
			rarity: number;
			nickname: string;
		};
		color: string;
		level: number;
		badges: Badge[];
		health: {
			value: number;
			max: number;
		};
		experience: {
			value: number;
			max: number;
		};
		money: number;
	};
}
