import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildElderPacketRes extends DraftBotPacket {
	foundPlayer!: boolean;

	sameGuild!: boolean;

	himself!: boolean;

	alreadyElder!: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildElderAcceptPacketRes extends DraftBotPacket {
	promotedKeycloakId!: string;

	guildName!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildElderRefusePacketRes extends DraftBotPacket {
	promotedKeycloakId!: string;
}

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandGuildElderPacketReq extends DraftBotPacket {
	askedPlayerKeycloakId!: string;
}