import { ItemCategory } from "../../../../Lib/src/constants/ItemConstants";
import { TournamentConstants } from "../../../../Lib/src/constants/TournamentConstants";
import type { TournamentParticipant } from "../database/game/models/TournamentParticipant";

export type TournamentRewardItemParticipant = Pick<TournamentParticipant, "id" | "finalRank">;

const TOP_RANK_REWARD_ITEM_CATEGORIES = [
	ItemCategory.WEAPON,
	ItemCategory.ARMOR,
	ItemCategory.OBJECT
] as const;

const OTHER_RANK_REWARD_ITEM_CATEGORIES = [
	ItemCategory.WEAPON,
	ItemCategory.ARMOR,
	ItemCategory.POTION,
	ItemCategory.OBJECT
] as const;

export function hasTopRankRewardItem(participant: TournamentRewardItemParticipant): participant is TournamentRewardItemParticipant & { finalRank: number } {
	return participant.finalRank !== null && participant.finalRank <= TournamentConstants.REWARD_ITEM_TOP_RANK_LIMIT;
}

/**
 * Get the category of the reward item of a participant.
 * It is derived from the participant id so that it stays the same between claim attempts:
 * a player told to free a slot in this category gets the item once the slot is freed.
 * @param participant
 */
export function getTournamentRewardItemCategory(participant: TournamentRewardItemParticipant): ItemCategory {
	const categories = hasTopRankRewardItem(participant) ? TOP_RANK_REWARD_ITEM_CATEGORIES : OTHER_RANK_REWARD_ITEM_CATEGORIES;
	return categories[participant.id % categories.length];
}
