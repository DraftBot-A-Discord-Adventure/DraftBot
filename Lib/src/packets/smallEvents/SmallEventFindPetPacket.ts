import {SmallEventPacket} from "./SmallEventPacket";
import {PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventFindPetPacket extends SmallEventPacket {
	isPetReceived!: boolean;

	petIsReceivedByGuild!: boolean; // If false, the player receives the pet

	petTypeID!: number;

	petSex!: string;

	isPetFood!: boolean;
}