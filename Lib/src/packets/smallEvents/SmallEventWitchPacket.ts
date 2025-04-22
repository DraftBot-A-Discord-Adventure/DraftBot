import { SmallEventPacket } from "./SmallEventPacket";
import {
	PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventWitchResultPacket extends SmallEventPacket {
	ingredientId!: string;

	isIngredient!: boolean;

	effectId!: string;

	timeLost!: number;

	lifeLoss!: number;

	outcome!: number;
}
