import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandGuildCreatePacketReq extends DraftBotPacket {
	keycloakId!: string;

	askedGuildName!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildCreatePacketRes extends DraftBotPacket {
	playerMoney!: number;

	foundGuild!: boolean;

	guildNameIsAvailable?: boolean;

	guildNameIsAcceptable?: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildCreateRefusePacketRes extends DraftBotPacket {

}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildCreateAcceptPacketRes extends DraftBotPacket {
	guildName!: string;
}
