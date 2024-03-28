import {DraftBotPacket} from "../DraftBotPacket";
import {Language} from "../../Language";

/**
 * Packet sent by the bot to get the map of a player
 */
export class CommandMapPacketReq extends DraftBotPacket {
	keycloakId!: string;

	language!: Language;
}


/**
 * Packet sent by the bot to display the map of a player
 */
export class CommandMapDisplayRes extends DraftBotPacket {
	foundPlayer!: boolean;

	keycloakId?: string;

	data?: {
		mapId: number;

		mapType: string;

		mapLink: {
			name: string;
			fallback?: string;
			forced: boolean;
		};

		inEvent: boolean;
	};
}