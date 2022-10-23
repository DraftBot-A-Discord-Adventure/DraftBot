import {CreateOptions, Model} from "sequelize";
import GuildPet from "../database/game/models/GuildPet";

export enum NumberChangeReason {
	// Default value. Used to detect missing parameters in functions
	NULL,

	// Value to use if you don't want to log the information, SHOULDN'T APPEAR IN THE DATABASE
	// You MUST also comment why you use this constant where you use it
	IGNORE,

	// Admin
	TEST,
	ADMIN,
	DEBUG,

	// Events
	BIG_EVENT,
	SMALL_EVENT,
	RECEIVE_COIN,

	// Pets
	PET_SELL,
	PET_FEED,
	PET_FREE,

	// Missions
	MISSION_FINISHED,
	MISSION_SHOP,

	// Guild
	GUILD_DAILY,
	GUILD_CREATE,

	// Items
	ITEM_SELL,
	DAILY,
	DRINK,

	// Misc
	SHOP,
	CLASS,
	UNLOCK,
	LEVEL_UP,
	RESPAWN,
	NEW_PLAYER
}

export enum ShopItemType {
	DAILY_POTION,
	RANDOM_ITEM,
	ALTERATION_HEAL,
	FULL_REGEN,
	SLOT_EXTENSION,
	BADGE,
	COMMON_FOOD,
	HERBIVOROUS_FOOD,
	CARNIVOROUS_FOOD,
	ULTIMATE_FOOD,
	MONEY,
	TREASURE,
	POINTS,
	MISSION_SKIP,
	PET_INFORMATION,
	GUILD_XP,
}

export type ModelType = { create: (values?: unknown, options?: CreateOptions<unknown>) => Promise<Model<unknown, unknown>> };

export type GuildLikeType = {
	id: number,
	name: string,
	creationDate: Date,
	chiefId: number,
	guildPets: GuildPet[]
}
