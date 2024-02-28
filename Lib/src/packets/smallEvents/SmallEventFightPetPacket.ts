import {SmallEventPacket} from "./SmallEventPacket";

export class SmallEventFightPetPacket extends SmallEventPacket {
	outcomeIsSuccess!: boolean;

	petId!: number;

	fightPetActionId!: string;
}