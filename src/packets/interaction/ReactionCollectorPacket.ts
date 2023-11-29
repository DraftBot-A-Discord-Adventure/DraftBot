import {DraftBotPacket} from "../DraftBotPacket";

export enum ReactionCollectorType {
    ACCEPT_ITEM,
    ACCEPT_ITEM_CHOICE,
	GOBLET_CHOOSE,
	SHOP_SMALL_EVENT,
	FIGHT_PET,
}

export interface ReactionCollectorCreationPacket extends DraftBotPacket {
    id: string,
    type: ReactionCollectorType,
    reactions: string[],
    endTime: number
}

export interface ReactionCollectorReactPacket extends DraftBotPacket {
    id: string,
    playerId: number,
    reaction: string
}

export interface ReactionCollectorEnded extends DraftBotPacket {

}