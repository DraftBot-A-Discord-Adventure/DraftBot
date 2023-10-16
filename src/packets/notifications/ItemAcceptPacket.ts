import {DraftBotPacket} from "../DraftBotPacket";

export interface ItemAcceptPacket extends DraftBotPacket {
    id: number,
    category: number
}