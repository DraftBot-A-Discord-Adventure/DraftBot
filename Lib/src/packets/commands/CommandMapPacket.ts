import {DraftBotPacket} from "../DraftBotPacket";
import {Language} from "../../Language";

export class CommandMapPacketReq extends DraftBotPacket {
	keycloakId!: string;

	language!: Language;
}

export class CommandMapDisplayRes extends DraftBotPacket {
	foundPlayer!: boolean;

	keycloakId?: string;

	data?: {
		mapId: number;

		mapLink: {
			name: string;
			forced: boolean;
		};

		inEvent: boolean;
	};
}