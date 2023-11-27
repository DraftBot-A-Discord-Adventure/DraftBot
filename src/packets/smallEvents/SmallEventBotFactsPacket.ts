import {SmallEventPacket} from "./SmallEventPacket";

export interface SmallEventBotFactsPacket extends SmallEventPacket {
    information: string,
    infoResult: number,
    infoComplement: number
}