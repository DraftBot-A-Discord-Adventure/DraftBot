import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket.js";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandGuildInvitePacketReq extends DraftBotPacket {
	invitingPlayer!: {
		keycloakId?: string
	};

	invitedPlayer!: {
		keycloakId?: string
	};
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildInvitePacketRes extends DraftBotPacket {
	invitingPlayerKeycloakId!: string;

	invitedPlayerKeycloakId!: string;

	guildName!: string;

	invitingPlayerNotInGuild?: boolean;

	guildIsFull?: boolean;

	invitedPlayerIsDead?: boolean;

	invitedPlayerIsOnPveIsland?: boolean;

	alreadyInAGuild?: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildInviteAcceptPacketRes extends DraftBotPacket {
	invitedPlayerKeycloakId!: string;

	guildName!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildInviteRefusePacketRes extends DraftBotPacket {
	invitedPlayerKeycloakId!: string;

	guildName!: string;
}