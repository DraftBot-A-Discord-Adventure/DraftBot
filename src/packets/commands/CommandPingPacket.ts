import {DraftBotPacket} from "../DraftBotPacket";

export interface CommandPingPacketReq extends DraftBotPacket {
    time: number
}

export interface CommandPingPacketRes extends DraftBotPacket {
    latency: number
}