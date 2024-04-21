import {DraftBotPacket} from "../DraftBotPacket";

export class CommandPetFreePacketReq extends DraftBotPacket {
	keycloakId!: string;
}

export class CommandPetFreePacketRes extends DraftBotPacket {
	foundPet!: boolean;

	petCanBeFreed!: boolean;

	data?: {
		petId: number,
		petName: string,
		petEffect: string,
		petEffectDuration: number,
		petEffectEndTime: number
	};
}