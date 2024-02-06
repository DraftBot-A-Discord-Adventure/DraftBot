import {DraftBotPacket} from "../DraftBotPacket";

export interface MissionsExpiredPacket extends DraftBotPacket {
    missions: {
        missionId: string,
        objective: number
        variant: number,
        numberDone: number
    }[]
}