import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

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
	foundPlayer!: boolean;

	data?: {
		classesStats: {
			id: number;
			health: number;
			attack: number;
			defense: number;
			speed: number;
			baseBreath: number;
			maxBreath: number;
			breathRegen: number;
			fightPoint: number;
			attacks: {
				id: string,
				cost: number
			}[];
		}[];
	};
}