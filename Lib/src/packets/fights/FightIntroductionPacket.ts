import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { OwnedPet } from "../../types/OwnedPet";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandFightIntroduceFightersPacket extends DraftBotPacket {
	fightInitiatorKeycloakId!: string;

	fightOpponentKeycloakId?: string;

	fightOpponentMonsterId?: string;

	fightInitiatorActions!: Array<[string, number]>;

	fightOpponentActions!: Array<[string, number]>;

	fightInitiatorPet?: OwnedPet;

	fightOpponentPet?: OwnedPet;
}
