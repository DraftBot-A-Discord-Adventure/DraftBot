import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";
import {BaseMission} from "../../interfaces/CompletedMission";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandMissionShopPacketReq extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMissionShopAlreadyBoughtPointsThisWeek extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMissionShopPetInformation extends DraftBotPacket {
	nickname!: string;

	typeId!: number;

	loveLevel!: number;

	lovePoints!: number;

	diet!: string;

	nextFeed!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMissionShopSkipMissionResult extends DraftBotPacket {
	oldMission!: BaseMission;

	newMission!: BaseMission;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMissionShopBadge extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMissionShopNoMissionToSkip extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMissionShopAlreadyHadBadge extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMissionShopNoPet extends DraftBotPacket {
}