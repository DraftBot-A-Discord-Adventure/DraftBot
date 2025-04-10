import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildDescriptionAcceptPacketRes extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildDescriptionRefusePacketRes extends DraftBotPacket {
}

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandGuildDescriptionPacketReq extends DraftBotPacket {
	description!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildDescriptionNoGuildPacket extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildDescriptionNotAnElderPacket extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandGuildDescriptionInvalidPacket extends DraftBotPacket {
	min!: number;

	max!: number;
}
