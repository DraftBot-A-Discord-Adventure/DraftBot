import {
	CITY_REACTION_KINDS, CityMobileEnchantedItem, CityMobileItem, CityMobileSnapshot, ReactionCollectorReaction
} from "ws-packets/src/fromServer/collectors";
import { i18n } from "@/src/translations/i18n";

export function cityItemName(item: {
	itemId: number; itemCategory: number;
}): string {
	const itemType = [
		"weapon",
		"armor",
		"potion",
		"object"
	][item.itemCategory] ?? "object";
	return i18n.t(`models:${itemType}s.${item.itemId}`);
}

function itemCandidates(snapshot: CityMobileSnapshot): CityMobileItem[] {
	return [
		...snapshot.enchanter?.enchantableItems ?? [],
		...snapshot.enchanter?.disenchantableItems ?? [],
		...snapshot.home?.owned?.upgradeStation?.upgradeableItems ?? [],
		...snapshot.blacksmith?.upgradeableItems ?? [],
		...snapshot.blacksmith?.disenchantableItems ?? [],
		...snapshot.scrapDealer?.recyclableItems ?? [],
		...snapshot.royalBlacksmith?.upgradeableItems ?? []
	];
}

export function itemSnapshotForReaction(snapshot: CityMobileSnapshot | undefined, reaction: ReactionCollectorReaction): CityMobileItem | undefined {
	if (!snapshot) {
		return undefined;
	}
	const data = reaction.data as {
		slot?: number; itemCategory?: number;
	};
	if (data.itemCategory === undefined || data.slot === undefined) {
		return undefined;
	}
	return itemCandidates(snapshot).find(item => item.itemCategory === data.itemCategory && item.itemId !== undefined && item.slot === data.slot);
}

/** The enchantment a city service would remove from the item, whether the blacksmith charges for it or Mernil does it for free. */
export function enchantedItemForReaction(snapshot: CityMobileSnapshot | undefined, reaction: ReactionCollectorReaction): CityMobileEnchantedItem | undefined {
	const item = itemSnapshotForReaction(snapshot, reaction);
	if (!item) {
		return undefined;
	}
	const enchantedItems = reaction.type === CITY_REACTION_KINDS.ENCHANTER_DISENCHANT ? snapshot?.enchanter?.disenchantableItems : snapshot?.blacksmith?.disenchantableItems;
	return enchantedItems?.find(candidate => candidate.slot === item.slot && candidate.itemCategory === item.itemCategory);
}

export function cityItemIconPath(item: Pick<CityMobileItem, "itemId" | "itemCategory">): string {
	const itemType = [
		"weapons",
		"armors",
		"potions",
		"objects"
	][item.itemCategory] ?? "objects";
	return `${itemType}.${item.itemId}`;
}
