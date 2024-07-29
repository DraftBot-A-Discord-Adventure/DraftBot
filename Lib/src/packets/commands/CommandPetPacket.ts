import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandPetPacketReq extends DraftBotPacket {
	askedPlayer!: {
		rank?: number,
		keycloakId?: string
	};
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetPacketRes extends DraftBotPacket {
	foundPet!: boolean;

	data?: {
		nickname: string,
		petTypeId: number,
		rarity: number,
		sex: string,
		loveLevel: number
	};
}