import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandSwitchPacketReq extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandSwitchSuccess extends DraftBotPacket {
	itemIdBackedUp!: number;

	itemIdEquipped!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandSwitchErrorNoItemToSwitch extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandSwitchCancelled extends DraftBotPacket {
}