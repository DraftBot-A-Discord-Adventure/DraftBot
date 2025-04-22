import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { BlockingReason } from "../../constants/BlockingConstants";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class ChangeBlockingReasonPacket extends DraftBotPacket {
	oldReason!: BlockingReason;

	newReason!: BlockingReason;
}
