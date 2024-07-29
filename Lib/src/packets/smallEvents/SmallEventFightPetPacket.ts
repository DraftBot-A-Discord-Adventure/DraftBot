import {SmallEventPacket} from "./SmallEventPacket";
import {PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventFightPetPacket extends SmallEventPacket {
	outcomeIsSuccess!: boolean;

	petId!: number;

	fightPetActionId!: string;
}