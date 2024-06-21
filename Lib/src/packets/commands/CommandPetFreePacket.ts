import {DraftBotPacket} from "../DraftBotPacket";

export class CommandPetFreePacketReq extends DraftBotPacket {
	keycloakId!: string;
}

export class CommandPetFreePacketRes extends DraftBotPacket {
	foundPet!: boolean;

	petCanBeFreed?: boolean;

	missingMoney?: number;

	cooldownRemainingTimeMs?: number;
}

export class CommandPetFreeRefusePacketRes extends DraftBotPacket {

}

export class CommandPetFreeAcceptPacketRes extends DraftBotPacket {
	petId!: number;

	petSex!: string;

	petNickname?: string;

	freeCost!: number;

	luckyMeat!: boolean;
}