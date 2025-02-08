import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightRefusePacketRes extends DraftBotPacket {
}

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandFightPacketReq extends DraftBotPacket {
	playerKeycloakId!: string;
}

/* @sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightEndOfFightPacketRes extends DraftBotPacket {
	fightInitiatorInformation!: EndOfFightPlayerStatus;

	fightOpponentInformation!: EndOfFightPlayerStatus;
}*/

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightIntroduceFightersPacket extends DraftBotPacket {
	fightInitiatorKeycloakId!: string;

	fightOpponentKeycloakId?: string;

	fightOpponentMonsterId?: string;

	fightInitiatorActions!: Array<[string,number]>;

	fightOpponentActions!: Array<[string,number]>;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightStatusPacket extends DraftBotPacket {
	fightInitiatorKeycloakId!: string;

	fightOpponentKeycloakId?: string;

	fightOpponentMonsterId?: string;

	fightInitiatorActions!: Array<[string,number]>;

	fightOpponentActions!: Array<[string,number]>;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightOpponentsNotFoundPacket extends DraftBotPacket {
}