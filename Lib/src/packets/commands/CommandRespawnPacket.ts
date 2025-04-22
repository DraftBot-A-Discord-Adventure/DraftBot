import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandRespawnPacketReq extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandRespawnPacketRes extends DraftBotPacket {
	lostScore!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandRespawnErrorAlreadyAlive extends DraftBotPacket {
}
