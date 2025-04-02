import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandMaintenancePacketReq extends DraftBotPacket {
	enable!: boolean;

	save!: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandMaintenancePacketRes extends DraftBotPacket {
	enabled!: boolean;
}
