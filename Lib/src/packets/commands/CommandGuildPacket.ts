import {DraftBotPacket} from "../DraftBotPacket";

export class CommandGuildPacketReq extends DraftBotPacket {
	askedPlayer!: {
		rank?: number,
		keycloakId?: string
	};

	askedGuildName?: string;
}

export interface GuildMemberPacket {
	keycloakId: string;
	rank: number,
	score: number
	islandStatus: {
		isOnPveIsland: boolean,
		isOnBoat: boolean,
		isPveIslandAlly: boolean,
		isInactive: boolean
		cannotBeJoinedOnBoat: boolean
	}
}

export class CommandGuildPacketRes extends DraftBotPacket {
	foundGuild!: boolean;

	askedPlayerKeycloakId? : string;

	data?: {
		name: string,
		description?: string,
		chiefId: number,
		elderId: number,
		level: number,
		experience: {
			value: number,
			max: number
		},
		rank: {
			unranked: boolean,
			rank: number,
			numberOfGuilds: number,
			score: number
		},
		members: GuildMemberPacket[]
	};
}