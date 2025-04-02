import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class RequirementEffectPacket extends DraftBotPacket {
	currentEffectId!: string;

	remainingTime!: number;
}
