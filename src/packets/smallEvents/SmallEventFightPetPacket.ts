import {ReactionCollectorCreationPacket} from "../interaction/ReactionCollectorPacket";
import {SmallEventPacket} from "./SmallEventPacket";

export interface SmallEventFightPetCollectorCreationPacket extends ReactionCollectorCreationPacket {
	petId: number;
}

export interface SmallEventFightPetPacket extends SmallEventPacket {
	outcomeIsSuccess: boolean;
	petId: number;
	fightPetActionId: string;
}