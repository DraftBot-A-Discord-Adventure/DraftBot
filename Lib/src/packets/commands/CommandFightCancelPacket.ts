import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandFightCancelPacketReq extends DraftBotPacket {
	fightId!: string;
}
