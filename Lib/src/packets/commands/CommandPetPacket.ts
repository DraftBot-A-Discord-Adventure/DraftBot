import {DraftBotPacket} from "../DraftBotPacket";

export class CommandPetPacketReq extends DraftBotPacket {
	askedPlayer!: {
		rank?: number,
		keycloakId?: string
	};
}

export class CommandPetPacketRes extends DraftBotPacket {
	foundPet!: boolean;

	data?: {
		nickname: string,
		emote: string,
		typeId: number,
		rarity: number,
		sex: string,
		loveLevel: number
	};
}