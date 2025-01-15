import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";
import {SexTypeShort} from "../../constants/StringConstants";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandPetPacketReq extends DraftBotPacket {
	askedPlayer!: {
		rank?: number,
		keycloakId?: string
	};
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetPacketRes extends DraftBotPacket {
	nickname!: string;

	petTypeId!: number;

	rarity!: number;

	sex!: SexTypeShort;

	loveLevel!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetPetNotFound extends DraftBotPacket {
}