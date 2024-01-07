import {DraftBotPacket} from "../DraftBotPacket";

export class CommandProfilePacketReq extends DraftBotPacket {
	askedPlayer!: {
		rank?: number,
		discordId?: string // todo change later
	};
}

export class CommandProfilePacketRes extends DraftBotPacket {
	foundPlayer!: boolean;

	playerId?: number;

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
		destination?: {
			id: number,
			emote: string
		},
		pet?: {
			id: number,
			rarity: number,
			nickname?: string,
			emote: string
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