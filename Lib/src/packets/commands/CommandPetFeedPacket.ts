import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";
import {PetFood} from "../../types/PetFood";
import {OwnedPet} from "../../types/OwnedPet";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandPetFeedPacketReq extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFeedNoPetErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFeedNotHungryErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFeedNoMoneyFeedErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFeedGuildStorageEmptyErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFeedCancelErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFeedSuccessPacket extends DraftBotPacket {
	food!: PetFood;

	pet!: OwnedPet;
}