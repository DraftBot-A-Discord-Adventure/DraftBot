import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandPetSellPacketReq extends DraftBotPacket {
	price!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellNoPetErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellNotInGuildErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellFeistyErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellBadPricePacketRes extends DraftBotPacket {
	minPrice!: number;

	maxPrice!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellGuildAtMaxLevelErrorPacket extends DraftBotPacket {}