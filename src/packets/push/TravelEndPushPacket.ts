import {DraftBotPacket} from "../DraftBotPacket";

export interface TravelEndPushPacket extends DraftBotPacket {
    destinationId: number
}