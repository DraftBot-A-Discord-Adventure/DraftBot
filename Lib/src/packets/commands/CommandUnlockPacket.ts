import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandUnlockPacketReq extends DraftBotPacket {
	askedPlayer!: {
		rank?: number,
		keycloakId?: string
	};
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandUnlockPacketRes extends DraftBotPacket {
	foundPlayer!: boolean;

	notInJail!: boolean;

	money!: number;

	himself!: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandUnlockAcceptPacketRes extends DraftBotPacket {
	unlockedKeycloakId!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandUnlockRefusePacketRes extends DraftBotPacket {

}