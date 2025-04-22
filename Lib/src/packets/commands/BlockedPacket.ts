import {
	DraftBotPacket, sendablePacket, PacketDirection
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class BlockedPacket extends DraftBotPacket {
	keycloakId!: string;

	reasons!: string[];
}
