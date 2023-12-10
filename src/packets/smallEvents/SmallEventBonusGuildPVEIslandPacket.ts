import {SmallEventPacket} from "./SmallEventPacket";

export class SmallEventBonusGuildPVEIslandPacket extends SmallEventPacket {
	hasEnoughMemberOnPVEIsland!: boolean;

	eventName!: string;

	amount!: string;

	isXp!: boolean;
}