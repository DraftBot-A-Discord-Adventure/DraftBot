import {DraftBotPacket} from "../DraftBotPacket";

export enum ReactionCollectorType {
    ACCEPT_ITEM,
    ACCEPT_ITEM_CHOICE,
	GOBLET_CHOOSE,
	SHOP_SMALL_EVENT,
	FIGHT_PET_SMALL_EVENT,
	WITCH_SMALL_EVENT,
}

export class ReactionCollectorCreationPacket extends DraftBotPacket {
	id!: string;

	type!: ReactionCollectorType;

	reactions!: string[];

	endTime!: number;
}

export class ReactionCollectorReactPacket extends DraftBotPacket {
	id!: string;

	playerId!: number;

	reaction!: string;
}

export class ReactionCollectorEnded extends DraftBotPacket {

}