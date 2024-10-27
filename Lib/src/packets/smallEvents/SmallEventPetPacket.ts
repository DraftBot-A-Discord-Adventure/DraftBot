import {SmallEventPacket} from "./SmallEventPacket";
import {PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventPetPacket extends SmallEventPacket {
	interactionName!: string;

	petTypeId!: number;

	petSex!: string;

	petNickname! : string | undefined;

	randomPetTypeId!: number;

	randomPetSex!: string;

	amount?: number; // Quantity of win/lose health points,money,energy,etc.

	food?: string; // The name of the food
}