import {DraftBotPacket} from "../DraftBotPacket";

export class CommandLanguagePacketReq extends DraftBotPacket {
}

export class CommandLanguagePacketRes extends DraftBotPacket {
	hasPermission!: boolean;
}