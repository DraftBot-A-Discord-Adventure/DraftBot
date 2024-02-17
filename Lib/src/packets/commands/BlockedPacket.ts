import {DraftBotPacket} from "../DraftBotPacket";

export class BlockedPacket extends DraftBotPacket {
	keycloakId!: string;

	reasons!: string[];
}