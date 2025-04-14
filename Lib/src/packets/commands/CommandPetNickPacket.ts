import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandPetNickPacketReq extends DraftBotPacket {
	keycloakId!: string;

	newNickname?: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetNickPacketRes extends DraftBotPacket {
	foundPet!: boolean;

	newNickname?: string;

	nickNameIsAcceptable?: boolean;
}
