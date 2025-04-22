import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import {
	MainItemDisplayPacket, SupportItemDisplayPacket
} from "./CommandInventoryPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandSwitchPacketReq extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandSwitchSuccess extends DraftBotPacket {
	itemBackedUp!: MainItemDisplayPacket | SupportItemDisplayPacket;

	itemEquipped!: MainItemDisplayPacket | SupportItemDisplayPacket;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandSwitchErrorNoItemToSwitch extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandSwitchCancelled extends DraftBotPacket {
}
