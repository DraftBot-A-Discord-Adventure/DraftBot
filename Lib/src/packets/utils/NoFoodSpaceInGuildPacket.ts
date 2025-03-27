import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";
import {PetFood} from "../../types/PetFood";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class NoFoodSpaceInGuildPacket extends DraftBotPacket {
	food!: PetFood;

	quantity!: number;
}