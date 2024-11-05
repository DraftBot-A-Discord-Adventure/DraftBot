import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class MissionsExpiredPacket extends DraftBotPacket {
	missions!: {
        missionId: string,
        objective: number
        variant: number,
        numberDone: number
    }[];
}