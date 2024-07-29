import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

type Fighter = {
    name: string,
    fightActions: string[]
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class FightIntroductionPacket extends DraftBotPacket {
	fighter1!: Fighter;

	fighter2!: Fighter;
}