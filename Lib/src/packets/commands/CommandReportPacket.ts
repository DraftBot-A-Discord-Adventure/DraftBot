import {DraftBotPacket} from "../DraftBotPacket";

/**
 * This packet gives what kind of answer is sent to the client
 */
export class CommandReportPacketRes extends DraftBotPacket {
	kind!: string;
}