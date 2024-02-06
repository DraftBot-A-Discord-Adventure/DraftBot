import {DraftBotPacket} from "../DraftBotPacket";

export interface ItemFoundPacket extends DraftBotPacket {
    id: number,
    category: number
}