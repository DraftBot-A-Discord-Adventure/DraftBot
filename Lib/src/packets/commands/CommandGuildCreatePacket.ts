import {DraftBotPacket} from "../DraftBotPacket";

export class CommandGuildCreatePacketReq extends DraftBotPacket {
	keycloakId!: string;

	askedGuildName!: string;
}

export class CommandGuildCreatePacketRes extends DraftBotPacket {
	foundGuild!: boolean;

	guildNameIsAvailable?: boolean;

	guildNameIsAcceptable?: boolean;
}