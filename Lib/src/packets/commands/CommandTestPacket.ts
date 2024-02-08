import {DraftBotPacket} from "../DraftBotPacket";

export class CommandTestPacketReq extends DraftBotPacket {
	keycloakId!: string;

	command?: string;
}

export class CommandTestPacketRes extends DraftBotPacket {
	commandName!: string;

	result!: string;

	isError!: boolean;
}