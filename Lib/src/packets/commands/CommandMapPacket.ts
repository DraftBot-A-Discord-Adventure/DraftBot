import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { Language } from "../../Language";

/**
 * Packet sent by the bot to get the map of a player
 */
@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandMapPacketReq extends DraftBotPacket {
	language!: Language;
}


/**
 * Packet sent by the bot to display the map of a player
 */
@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMapDisplayRes extends DraftBotPacket {
	mapId!: number;

	mapType!: string;

	mapLink!: {
		name: string;
		fallback?: string;
		forced: boolean;
	};

	inEvent!: boolean;
}
