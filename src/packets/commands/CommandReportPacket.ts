import {DraftBotPacket} from "../DraftBotPacket";

/**
 * This packet gives what kind of answer is sent to the client
 */
export interface CommandReportPacketRes extends DraftBotPacket {
	kind: string
}


/**
 * This packet gives what small event has been executed
 */
export interface SmallEventPacket extends DraftBotPacket {
	smallEvent: string
}