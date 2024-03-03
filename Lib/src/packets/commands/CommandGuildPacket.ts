import {DraftBotPacket} from "../DraftBotPacket";

export class CommandGuildPacketReq extends DraftBotPacket {
	askedPlayer?: {
		rank?: number,
		keycloakId?: string
	};
	guildName?: string;
}

export class CommandGuildPacketRes extends DraftBotPacket {
	foundGuild!: boolean;
}