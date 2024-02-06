import {ReactionCollectorCreationPacket} from "../interaction/ReactionCollectorPacket";
import {SmallEventPacket} from "./SmallEventPacket";

export class SmallEventFightPetCollectorCreationPacket extends ReactionCollectorCreationPacket {
	petId!: number;

	isFemale!: boolean;
}

export class SmallEventFightPetPacket extends SmallEventPacket {
	outcomeIsSuccess!: boolean;

	petId!: number;

	fightPetActionId!: string;
}