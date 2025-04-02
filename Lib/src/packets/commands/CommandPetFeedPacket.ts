import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { OwnedPet } from "../../types/OwnedPet";

export enum CommandPetFeedResult {
	HAPPY = "happy",
	VERY_HAPPY = "veryHappy",
	VERY_VERY_HAPPY = "veryVeryHappy",
	DISLIKE = "dislike"
}

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandPetFeedPacketReq extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFeedNoPetErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFeedNotHungryErrorPacket extends DraftBotPacket {
	pet!: OwnedPet;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFeedNoMoneyFeedErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFeedGuildStorageEmptyErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFeedCancelErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetFeedSuccessPacket extends DraftBotPacket {
	result!: CommandPetFeedResult;
}
