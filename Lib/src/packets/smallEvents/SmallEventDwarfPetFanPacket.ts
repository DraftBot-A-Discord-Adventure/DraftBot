import {
	PacketDirection,
	sendablePacket
} from "../DraftBotPacket";
import { SmallEventPacket } from "./SmallEventPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventDwarfPetFanPacket extends SmallEventPacket {
	petNickname!: string | undefined;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventDwarfPetFanPetAlreadySeen extends SmallEventPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventDwarfPetFanNoPet extends SmallEventPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventDwarfPetFanAllPetsSeen extends SmallEventPacket {
}
