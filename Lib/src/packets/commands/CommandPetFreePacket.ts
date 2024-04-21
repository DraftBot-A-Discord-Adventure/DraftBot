import {DraftBotPacket} from "../DraftBotPacket";

export class CommandPetFreePacketReq extends DraftBotPacket {
	keycloakId!: string;
}

export class CommandPetFreePacketRes extends DraftBotPacket {
	foundPet!: boolean;

	petCanBeFreed!: boolean;

	data?: {
		nickname: string,
		petTypeId: number,
		rarity: number,
		sex: string,
		loveLevel: number
	};

	luckyMeat?: boolean;
}