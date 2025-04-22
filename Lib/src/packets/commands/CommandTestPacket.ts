import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandTestPacketReq extends DraftBotPacket {
	keycloakId!: string;

	command?: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandTestPacketRes extends DraftBotPacket {
	commandName!: string;

	result!: string;

	isError!: boolean;
}
