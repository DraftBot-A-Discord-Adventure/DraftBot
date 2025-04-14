import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandGuildStoragePacketReq extends DraftBotPacket {
}

export class FoodStorage {
	id!: string;

	amount!: number;

	maxAmount!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildStoragePacketRes extends DraftBotPacket {
	foods!: FoodStorage[];

	guildName!: string;
}
