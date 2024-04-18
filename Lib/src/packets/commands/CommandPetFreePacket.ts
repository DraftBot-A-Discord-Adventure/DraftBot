import {DraftBotPacket} from "../DraftBotPacket";

export class CommandPetFreePacketReq extends DraftBotPacket {
}

export class CommandPetFreePacketRes extends DraftBotPacket {
	foundPet!: boolean;
}