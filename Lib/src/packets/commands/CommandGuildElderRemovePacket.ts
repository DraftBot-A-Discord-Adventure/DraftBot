import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildElderRemoveAcceptPacketRes extends DraftBotPacket {
	demotedKeycloakId!: string;

	guildName!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildElderRemoveRefusePacketRes extends DraftBotPacket {
	demotedKeycloakId!: string;
}

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandGuildElderRemovePacketReq extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildElderRemoveNoElderPacket extends DraftBotPacket {
}
