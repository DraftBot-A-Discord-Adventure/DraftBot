import {PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandGuildKickPacketReq {
	keycloakId!: string;

	askedPlayer!: {
		rank?: number,
		keycloakId?: string
	};
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildKickPacketRes {
	foundPlayer!: boolean;

	sameGuild!: boolean;

	himself!: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildKickRefusePacketRes {

}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildKickAcceptPacketRes {
	kickedKeycloakId!: string;

	guildName!: string;
}
