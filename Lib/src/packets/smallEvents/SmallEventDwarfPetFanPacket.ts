import {
	PacketDirection,
	sendablePacket
} from "../DraftBotPacket";
import { SmallEventPacket } from "./SmallEventPacket";
import { SexTypeShort } from "../../constants/StringConstants";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventDwarfPetFanPacket extends SmallEventPacket {
	petNickname?: string | undefined;

	petSex?: SexTypeShort;

	petTypeId?: number;

	amount?: number;

	interactionName!: string;

	isGemReward?: boolean;
}
