import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { AdminPlayerInfoData } from "../../types/AdminPlayerInfoData";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandGetPlayerInfoReq extends DraftBotPacket {
	keycloakId!: string;

	dataToGet!: {
		badges?: boolean;
	};
}

@sendablePacket(PacketDirection.NONE)
export class CommandGetPlayerInfoRes extends DraftBotPacket {
	exists!: boolean;

	data!: AdminPlayerInfoData;
}
