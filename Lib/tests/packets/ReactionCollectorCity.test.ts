import {
	describe, expect, it
} from "vitest";
import {
	ReactionCollectorCity, ReactionCollectorCityData, ReactionCollectorUpgradeItemReaction
} from "../../src/packets/interaction/ReactionCollectorCity";
import { ItemCategory } from "../../src/constants/ItemConstants";
import { ChestSlotsPerCategory } from "../../src/types/HomeFeatures";

type UpgradeStation = NonNullable<NonNullable<ReactionCollectorCityData["home"]["owned"]>["upgradeStation"]>;

const SWORD_IN_ACTIVE_SLOT = {
	slot: 0,
	category: ItemCategory.WEAPON
} as UpgradeStation["upgradeableItems"][number];

const INVENTORY_CAPACITY: ChestSlotsPerCategory = {
	weapon: 3,
	armor: 2,
	potion: 4,
	object: 4
};

function getUpgradeTargets(owned: Partial<NonNullable<ReactionCollectorCityData["home"]["owned"]>>): ReactionCollectorUpgradeItemReaction[] {
	const data = {
		gardenOnly: true,
		home: { owned }
	} as unknown as ReactionCollectorCityData;
	return new ReactionCollectorCity(data).creationPacket("id", 0).reactions
		.filter(reaction => reaction.type === ReactionCollectorUpgradeItemReaction.name)
		.map(reaction => reaction.data as ReactionCollectorUpgradeItemReaction);
}

describe("ReactionCollectorCity upgrade station reactions", () => {
	it("offers every equipment slot of the inventory when the chest can change its content (#4789)", () => {
		const targets = getUpgradeTargets({
			upgradeStation: { upgradeableItems: [SWORD_IN_ACTIVE_SLOT] } as UpgradeStation,
			chest: { inventoryCapacity: INVENTORY_CAPACITY } as NonNullable<ReactionCollectorCityData["home"]["owned"]>["chest"]
		});

		expect(targets).toEqual([
			{ slot: 0, itemCategory: ItemCategory.WEAPON },
			{ slot: 1, itemCategory: ItemCategory.WEAPON },
			{ slot: 2, itemCategory: ItemCategory.WEAPON },
			{ slot: 0, itemCategory: ItemCategory.ARMOR },
			{ slot: 1, itemCategory: ItemCategory.ARMOR }
		]);
	});

	it("only offers the listed equipment without a chest", () => {
		const targets = getUpgradeTargets({
			upgradeStation: { upgradeableItems: [SWORD_IN_ACTIVE_SLOT] } as UpgradeStation
		});

		expect(targets).toEqual([{ slot: 0, itemCategory: ItemCategory.WEAPON }]);
	});
});
