import {
	PacketDirection,
	sendablePacket
} from "../DraftBotPacket";
import { SmallEventPacket } from "./SmallEventPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventDwarfAnimalFanPacket extends SmallEventPacket {
	petNickname!: string | undefined;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventDwarfAnimalFanPetAlreadySeenOrNoPetPacket extends SmallEventPacket {
}
