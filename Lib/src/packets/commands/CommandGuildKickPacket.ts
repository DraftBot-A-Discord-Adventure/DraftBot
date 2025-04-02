import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandGuildKickPacketReq extends DraftBotPacket {
	askedPlayer!: {
		rank?: number;
		keycloakId?: string;
	};
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildKickPacketRes extends DraftBotPacket {
	foundPlayer!: boolean;

	sameGuild!: boolean;

	himself!: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildKickBlockedErrorPacket extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildKickRefusePacketRes extends DraftBotPacket {
	kickedKeycloakId!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildKickAcceptPacketRes extends DraftBotPacket {
	kickedKeycloakId!: string;

	guildName!: string;
}
