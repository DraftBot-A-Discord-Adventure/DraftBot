import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandProfilePacketReq extends DraftBotPacket {
	askedPlayer!: {
		rank?: number,
		keycloakId?: string
	};
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandProfilePacketRes extends DraftBotPacket {
	foundPlayer!: boolean;

	keycloakId?: string;

	data?: {
		stats?: {
			energy: {
				value: number,
				max: number
			},
			attack: number,
			defense: number,
			speed: number
			breath: {
				base: number,
				max: number,
				regen: number
			}
		},
		missions: {
			gems: number,
			campaignProgression: number
		},
		rank: {
			unranked: boolean,
			rank: number,
			numberOfPlayers: number,
			score: number
		},
		effect?: {
			healed: boolean,
			timeLeft: number,
			effect: string
		},
		class?: number,
		fightRanking?: {
			glory: number,
			league: number
		},
		guild?: string,
		destination?: number,
		pet?: {
			typeId: number,
			sex: string,
			rarity: number,
			nickname?: string
		},
		color: string,
		level: number,
		badges: string[],
		health: {
			value: number,
			max: number
		},
		experience: {
			value: number,
			max: number
		},
		money: number
	};
}