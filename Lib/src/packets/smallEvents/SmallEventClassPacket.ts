import {PacketDirection, sendablePacket} from "../DraftBotPacket";
import {SmallEventPacket} from "./SmallEventPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class SmallEventClassPacket extends SmallEventPacket {
	classKind!: "basic" |"attack" | "defense" | "other";

	interactionName!: string;

	amount?: number;
}