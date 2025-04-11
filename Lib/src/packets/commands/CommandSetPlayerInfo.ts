import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { AdminPlayerInfoData } from "../../types/AdminPlayerInfoData";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandSetPlayerInfoReq extends DraftBotPacket {
	keycloakId!: string;

	dataToSet!: AdminPlayerInfoData;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandSetPlayerInfoRes extends DraftBotPacket {
	keycloakId!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandSetPlayerInfoDoesntExistError extends DraftBotPacket {}
