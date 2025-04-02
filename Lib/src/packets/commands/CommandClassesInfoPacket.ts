import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { ClassStats } from "../../types/ClassStats";

/**
 * Packet sent by the bot to gather information about selectable classes
 */
@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandClassesInfoPacketReq extends DraftBotPacket {
	// No data needed
}

/**
 * Packet sent by the bot to display information about selectable classes
 */
@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandClassesInfoPacketRes extends DraftBotPacket {
	data?: {
		classesStats: {
			id: number;
			stats: ClassStats;
			attacks: {
				id: string;
				cost: number;
			}[];
		}[];
	};
}
