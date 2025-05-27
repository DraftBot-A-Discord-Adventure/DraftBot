import {
	PacketDirection,
	sendablePacket
} from "../DraftBotPacket";
import { SmallEventPacket } from "./SmallEventPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventDwarfPetFanNewPetPacket extends SmallEventPacket {
	amount!: number;

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
	isGemReward?: boolean;

	amount!: number;
}
