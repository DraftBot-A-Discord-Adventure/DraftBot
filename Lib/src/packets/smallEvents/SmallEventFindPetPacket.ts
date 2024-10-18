import {SmallEventPacket} from "./SmallEventPacket";
import {PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventFindPetPacket extends SmallEventPacket {
	isPetReceived!: boolean;

	isGuildOrPlayer!: boolean;

	petID!: number;

	petGenre!: string;

	isPetFood!: boolean;
}