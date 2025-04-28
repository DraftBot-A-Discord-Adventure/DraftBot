import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class ErrorPacket extends DraftBotPacket {
	message!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class ErrorMaintenancePacket extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class ErrorBannedPacket extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class ErrorResetIsNow extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class ErrorSeasonEndIsNow extends DraftBotPacket {
}