import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";
import {MainItemDisplayPacket, SupportItemDisplayPacket} from "../../interfaces/ItemDisplayPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandInventoryPacketReq extends DraftBotPacket {
	askedPlayer!: {
		rank?: number,
		keycloakId?: string
	};
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandInventoryPacketRes extends DraftBotPacket {
	foundPlayer!: boolean;

	keycloakId?: string;

	data?: {
		weapon: MainItemDisplayPacket,
		armor: MainItemDisplayPacket,
		potion: SupportItemDisplayPacket,
		object: SupportItemDisplayPacket,
		backupWeapons: { display: MainItemDisplayPacket, slot: number }[],
		backupArmors: { display: MainItemDisplayPacket, slot: number }[],
		backupPotions: { display: SupportItemDisplayPacket, slot: number }[],
		backupObjects: { display: SupportItemDisplayPacket, slot: number }[],
		slots: {
			weapons: number,
			armors: number,
			potions: number,
			objects: number
		}
	};
}