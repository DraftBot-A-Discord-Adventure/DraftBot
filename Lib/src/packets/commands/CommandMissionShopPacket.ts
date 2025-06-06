import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { BaseMission } from "../../types/CompletedMission";
import { PetDiet } from "../../constants/PetConstants";
import { SexTypeShort } from "../../constants/StringConstants";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandMissionShopPacketReq extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMissionShopAlreadyBoughtPointsThisWeek extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMissionShopMoney extends DraftBotPacket {
	amount!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMissionShopKingsFavor extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMissionShopPetInformation extends DraftBotPacket {
	nickname!: string;

	petId!: number;

	typeId!: number;

	sex!: SexTypeShort;

	loveLevel!: number;

	lovePoints!: number;

	diet!: PetDiet;

	nextFeed!: number;

	fightAssistId!: string;

	ageCategory!: string;

	randomPetDwarf?: {
		typeId: number;
		sex: SexTypeShort;
		numberOfPetsNotSeen: number;
	};
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
