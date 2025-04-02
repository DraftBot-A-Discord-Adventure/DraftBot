import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { OwnedPet } from "../../types/OwnedPet";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandPetPacketReq extends DraftBotPacket {
	askedPlayer!: {
		rank?: number;
		keycloakId?: string;
	};
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetPacketRes extends DraftBotPacket {
	askedKeycloakId?: string | null;

	pet!: OwnedPet;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetPetNotFound extends DraftBotPacket {
}
