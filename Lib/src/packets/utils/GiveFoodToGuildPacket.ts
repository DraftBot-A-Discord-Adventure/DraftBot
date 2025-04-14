import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class GiveFoodToGuildPacket extends DraftBotPacket {
	quantity!: number;

	selectedFoodIndex!: number;
}
