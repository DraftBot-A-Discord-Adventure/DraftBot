import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandDrinkPacketReq extends DraftBotPacket {
	force!: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandDrinkNoActiveObjectError extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandDrinkObjectIsActiveDuringFights extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandDrinkCancelDrink extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandDrinkConsumePotionRes extends DraftBotPacket {
	health?: number;

	energy?: number;

	time?: number;
}
