import {DraftBotPacket} from "../DraftBotPacket";

export interface GuildLevelUpPacket extends DraftBotPacket {
    guildName: string,
    level: number
}