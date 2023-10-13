import {DraftBotPacket} from "../DraftBotPacket";

export interface PlayerLeavePveIslandPacket extends DraftBotPacket {
    moneyLost: number,
    guildPointsLost: number
}