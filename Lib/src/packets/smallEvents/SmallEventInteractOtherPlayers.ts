import {SmallEventPacket} from "./SmallEventPacket";

export enum InteractOtherPlayerInteraction {
	TOP1,
	TOP10,
	TOP50,
	TOP100,
	POWERFUL_GUILD,
	STAFF_MEMBER,
	BEGINNER,
	ADVANCED,
	SAME_CLASS,
	SAME_GUILD,
	TOP_WEEK,
	LOW_HP,
	FULL_HP,
	UNRANKED,
	LOWER_RANK_THAN_THEM,
	BETTER_RANK_THAN_THEM,
	RICH,
	POOR,
	PET,
	GUILD_CHIEF,
	GUILD_ELDER,
	EFFECT,
	WEAPON,
	ARMOR,
	POTION,
	OBJECT,
	CLASS
}

export class SmallEventInteractOtherPlayersPacket extends SmallEventPacket {
	keycloakId?: string;

	playerInteraction?: InteractOtherPlayerInteraction;

	data?: {
		rank?: number,
		level: number,
		classId: number,
		petId?: number,
		petName?: string,
		guildName?: string,
		weaponId: number,
		armorId: number,
		potionId: number,
		objectId: number,
		effectId: string
	};
}

export class SmallEventInteractOtherPlayersRefuseToGivePoorPacket extends SmallEventPacket {}

export class SmallEventInteractOtherPlayersAcceptToGivePoorPacket extends SmallEventPacket {}