import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightRefusePacketRes extends DraftBotPacket {
}

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandFightPacketReq extends DraftBotPacket {
	playerKeycloakId!: string;
}