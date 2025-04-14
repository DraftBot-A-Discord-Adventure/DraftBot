import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket.js";
import { ItemNature } from "../../constants/ItemConstants";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandDailyBonusPacketReq extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandDailyBonusNoActiveObject extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandDailyBonusInCooldown extends DraftBotPacket {
	timeBetweenDailies!: number;

	lastDailyTimestamp!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandDailyBonusObjectIsActiveDuringFights extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandDailyBonusObjectDoNothing extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandDailyBonusPacketRes extends DraftBotPacket {
	value!: number;

	itemNature!: ItemNature;
}
