import {SmallEventPacket} from "./SmallEventPacket";

export interface SmallEventBonusGuildPVEIslandPacket extends SmallEventPacket {
    hasEnoughMemberOnPVEIsland: boolean,
    amount: string,
    isXp: boolean
}