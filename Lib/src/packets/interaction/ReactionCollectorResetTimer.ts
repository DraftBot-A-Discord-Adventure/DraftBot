import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class ReactionCollectorResetTimerPacketReq extends DraftBotPacket {
	reactionCollectorId!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class ReactionCollectorResetTimerPacketRes extends DraftBotPacket {
	reactionCollectorId!: string;

	endTime!: number;
}
