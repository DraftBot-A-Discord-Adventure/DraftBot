import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket.js";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandGuildInvitePacketReq extends DraftBotPacket {
	invitedPlayerkeycloakId!: string;
}

@sendablePacket(PacketDirection.NONE)
export class CommandGuildInviteErrorPacket extends DraftBotPacket {
	invitedPlayerKeycloakId!: string;

	guildName!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildInviteInvitingPlayerNotInGuild extends CommandGuildInviteErrorPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildInviteLevelTooLow extends CommandGuildInviteErrorPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildInviteGuildIsFull extends CommandGuildInviteErrorPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildInviteInvitedPlayerIsDead extends CommandGuildInviteErrorPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildInviteInvitedPlayerIsOnPveIsland extends CommandGuildInviteErrorPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildInviteAlreadyInAGuild extends CommandGuildInviteErrorPacket {
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
