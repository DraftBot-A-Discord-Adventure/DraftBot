export enum ReactionCollectorType {
    ACCEPT_ITEM,
    ACCEPT_ITEM_CHOICE
}

export interface ReactionCollectorCreationPacket {
    id: string,
    type: ReactionCollectorType,
    reactions: string[],
    endTime: number
}

export interface ReactionCollectorReactPacket {
    id: string,
    playerId: number,
    reaction: string
}

export interface ReactionCollectorEnded {

}