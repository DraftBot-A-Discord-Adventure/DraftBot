import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandLeagueRewardPacketReq extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandLeagueRewardNotSundayPacketRes extends DraftBotPacket {
	nextSunday!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandLeagueRewardNoPointsPacketRes extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandLeagueRewardAlreadyClaimedPacketRes extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandLeagueRewardSuccessPacketRes extends DraftBotPacket {
	score!: number;

	money!: number;

	xp!: number;

	gloryPoints!: number;

	oldLeagueId!: number;

	rank!: number;
}
