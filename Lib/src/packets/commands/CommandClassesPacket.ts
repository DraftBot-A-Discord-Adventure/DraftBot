import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandClassesPacketReq extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandClassesCooldownErrorPacket extends DraftBotPacket {
	totalTime!: number;

	remainingTime!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandClassesCancelErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandClassesChangeSuccessPacket extends DraftBotPacket {
	classId!: number;
}