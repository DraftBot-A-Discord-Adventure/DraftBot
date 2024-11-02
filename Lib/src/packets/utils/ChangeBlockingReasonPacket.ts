import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";
import {BlockingReason} from "../../constants/BlockingConstants";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class ChangeBlockingReasonPacket extends DraftBotPacket {
	oldReason!: BlockingReason;

	newReason!: BlockingReason;
}