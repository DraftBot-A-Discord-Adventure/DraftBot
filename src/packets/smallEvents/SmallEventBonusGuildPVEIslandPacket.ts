import {SmallEventPacket} from "./SmallEventPacket";

export interface SmallEventBonusGuildPVEIslandPacket extends SmallEventPacket {
    hasEnoughMemberOnPVEIsland: boolean,
    eventName: string,
    amount: string,
    isXp: boolean
}