import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class ReactionCollectorStopPacket extends DraftBotPacket {
	id!: string;
}
