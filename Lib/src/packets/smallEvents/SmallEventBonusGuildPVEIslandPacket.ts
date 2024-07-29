import {SmallEventPacket} from "./SmallEventPacket";
import {PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventBonusGuildPVEIslandPacket extends SmallEventPacket {
	hasEnoughMemberOnPVEIsland!: boolean;

	eventName!: string;

	amount!: string;

	isXp!: boolean;
}