import {DraftBotPacket} from "../DraftBotPacket";

export class CommandPetNickPacketReq extends DraftBotPacket {
	keycloakId!: string;

	newNickname?: string;
}

export class CommandPetNickPacketRes extends DraftBotPacket {
	foundPet!: boolean;

	newNickname?: string;

	nickNameIsAcceptable?: boolean;
}