import {ItemConstants} from "../core/constants/ItemConstants";
import {ItemDataController} from "./DataController";
import {SupportItem} from "./SupportItem";
import {RandomUtils} from "../core/utils/RandomUtils";
import {ObjectItem} from "./ObjectItem";

export class Potion extends SupportItem {
	categoryName = "potions";

	public getCategory(): number {
		return ItemConstants.CATEGORIES.POTION;
	}

	public isFightPotion(): boolean {
		return this.getSpeed() !== 0 || this.getAttack() !== 0 ||
			this.getDefense() !== 0;
	}

	public getItemAddedValue(): number {
		return this.power;
	}
}

export class PotionDataController extends ItemDataController<number, Potion> {
	static readonly instance: PotionDataController = new PotionDataController("potions");

	newInstance(): Potion {
		return new Potion();
	}

	public randomItem(nature: number, rarity: number): ObjectItem {
		return RandomUtils.draftbotRandom.pick(this.getValuesArray()
			.filter((item) => item.nature === nature && item.rarity === rarity));
	}

	/**
	 * Get a random shop potion
	 * @param excludeId Prevent the potion to be with this id
	 */
	public randomShopPotion(excludeId = -1): Potion {
		return RandomUtils.draftbotRandom.pick(
			this.getValuesArray()
				.filter((item) =>
					item.nature !== ItemConstants.NATURE.NONE &&
					item.rarity < ItemConstants.RARITY.LEGENDARY &&
					item.id !== excludeId
				)
		);
	}
}