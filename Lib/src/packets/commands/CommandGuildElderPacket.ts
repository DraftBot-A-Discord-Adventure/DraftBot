import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

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

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildElderSameGuildPacketRes extends DraftBotPacket {
	sameGuild!: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildElderHimselfPacketRes extends DraftBotPacket {
	himself!: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildElderAlreadyElderPacketRes extends DraftBotPacket {
	alreadyElder!: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildElderFoundPlayerPacketRes extends DraftBotPacket {
	foundPlayer!: boolean;
}