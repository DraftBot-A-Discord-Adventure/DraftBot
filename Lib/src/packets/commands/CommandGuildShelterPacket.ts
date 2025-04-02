import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { OwnedPet } from "../../types/OwnedPet";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandGuildShelterPacketReq extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildShelterPacketRes extends DraftBotPacket {
	guildName!: string;

	pets!: OwnedPet[];

	maxCount!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildShelterNoPetErrorPacket extends DraftBotPacket {}
