import {DraftBotPacket} from "../DraftBotPacket";

type Fighter = {
    name: string,
    fightActions: string[]
}

export interface FightIntroductionPacket extends DraftBotPacket {
    fighter1: Fighter,
    fighter2: Fighter
}