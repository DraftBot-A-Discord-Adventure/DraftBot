import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandUnlockPacketReq extends DraftBotPacket {
	askedPlayer!: {
		rank?: number;
		keycloakId?: string;
	};
}

@sendablePacket(PacketDirection.NONE)
export class CommandUnlockErrorPacket extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandUnlockNoPlayerFound extends CommandUnlockErrorPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandUnlockNotInJail extends CommandUnlockErrorPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandUnlockNotEnoughMoney extends CommandUnlockErrorPacket {
	money!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandUnlockHimself extends CommandUnlockErrorPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandUnlockAcceptPacketRes extends DraftBotPacket {
	unlockedKeycloakId!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandUnlockRefusePacketRes extends DraftBotPacket {

}
