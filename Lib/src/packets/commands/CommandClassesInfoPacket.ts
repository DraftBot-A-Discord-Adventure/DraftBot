import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";
import {Language} from "../../Language";

/**
 * Packet sent by the bot to gather information about selectable classes
 */
@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandClassesInfoPacketReq extends DraftBotPacket {
	keycloakId!: string;

	language!: Language;

	chosenClass?: string;
}

/**
 * Packet sent by the bot to display information about selectable classes
 */
@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandClassesInfoPacketRes extends DraftBotPacket {
	foundPlayer!: boolean;

	keycloakId?: string;

	data?: {
		classesStats: {
			id: number;
			emoji: string;
			lng: string;
			health: number;
			attack: number;
			defense: number;
			speed: number;
			baseBreath: number;
			maxBreath: number;
			breathRegen: number;
			fightPoint: number;
		}[];

		classesList?: string[];

		chosenClass?: {
			name: string;
			description: string;
			attacks: {
				name: string;
				description: string;
			}[]
		}
	};
}