import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { SexTypeShort } from "../../constants/StringConstants";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class PlayerReceivePetPacket extends DraftBotPacket {
	noRoomInGuild!: boolean;

	giveInGuild!: boolean;

	giveInPlayerInv!: boolean;

	petTypeId!: number;

	petSex!: SexTypeShort;
}
