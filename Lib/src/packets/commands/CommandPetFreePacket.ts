import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { SexTypeShort } from "../../constants/StringConstants";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandPetFreePacketReq extends DraftBotPacket {
	keycloakId!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFreePacketRes extends DraftBotPacket {
	foundPet!: boolean;

	petCanBeFreed?: boolean;

	missingMoney?: number;

	cooldownRemainingTimeMs?: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFreeRefusePacketRes extends DraftBotPacket {

}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFreeAcceptPacketRes extends DraftBotPacket {
	petId!: number;

	petSex!: SexTypeShort;

	petNickname?: string;

	freeCost!: number;

	luckyMeat!: boolean;
}
