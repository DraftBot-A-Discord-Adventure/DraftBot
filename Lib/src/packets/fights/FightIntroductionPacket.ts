import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { OwnedPet } from "../../types/OwnedPet";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightIntroduceFightersPacket extends DraftBotPacket {
	fightId!: string;

	fightInitiatorKeycloakId!: string;

	initiatorRanking!: number;

	opponentRanking!: number;

	fightOpponentKeycloakId?: string;

	fightOpponentMonsterId?: string;

	fightInitiatorActions!: Array<[string, number]>;

	fightOpponentActions!: Array<[string, number]>;

	fightInitiatorPet?: OwnedPet;

	fightOpponentPet?: OwnedPet;
}
