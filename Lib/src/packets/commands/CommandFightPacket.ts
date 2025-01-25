import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";
import {EndOfFightPlayerStatus} from "../../types/EndOfFightPlayerStatus";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightRefusePacketRes extends DraftBotPacket {
}

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandFightPacketReq extends DraftBotPacket {
	playerKeycloakId!: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightEndOfFightPacketRes extends DraftBotPacket {
	fightInitiatorInformation!: EndOfFightPlayerStatus;

	fightOpponentInformation!: EndOfFightPlayerStatus;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightIntroduceFightersPacket extends DraftBotPacket {
	fightInitiatorKeycloakId!: string;

	fightOpponentKeycloakId?: string;

	fightOpponentMonsterId?: string;

	fightInitiatorActions!: string[];

	fightOpponentActions!: string[];
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightOpponentsNotFoundPacket extends DraftBotPacket {
}