import {DraftBotPacket} from "../DraftBotPacket";

export interface ItemRefusePacket extends DraftBotPacket {
    id: number,
    category: number,
    autoSell: boolean
}