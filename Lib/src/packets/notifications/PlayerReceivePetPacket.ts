import {DraftBotPacket} from "../DraftBotPacket";

export interface PlayerReceivePetPacket extends DraftBotPacket {
    noRoomInGuild: boolean,
    giveInGuild: boolean,
    giveInPlayerInv: boolean,
    petId: number,
    petSex: string
}