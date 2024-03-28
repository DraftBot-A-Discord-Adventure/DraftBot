import {DraftBotPacket} from "../DraftBotPacket";

export interface PlayerReceivePetPacket extends DraftBotPacket {
    noRoomInGuild: boolean,
    giveInGuild: boolean,
    giveInPlayerInv: boolean,
    petTypeId: number,
    petSex: string
}