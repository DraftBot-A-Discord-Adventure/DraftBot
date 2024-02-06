import {ReactionCollectorCreationPacket} from "../interaction/ReactionCollectorPacket";
import {SmallEventPacket} from "./SmallEventPacket";

export class SmallEventWitchCollectorCreationPacket extends ReactionCollectorCreationPacket {}

export class SmallEventWitchResultPacket extends SmallEventPacket {
	outcome!: number;
}