import {ReactionCollectorCreationPacket} from "../interaction/ReactionCollectorPacket";
import {SmallEventPacket} from "./SmallEventPacket";

export interface SmallEventWitchCollectorCreationPacket extends ReactionCollectorCreationPacket {}

export interface SmallEventWitchResultPacket extends SmallEventPacket {
	outcome: number;
}