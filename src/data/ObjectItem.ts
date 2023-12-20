import {ItemCategory} from "../core/constants/ItemConstants";
import {ItemDataController} from "./DataController";
import {SupportItem} from "./SupportItem";
import {RandomUtils} from "../core/utils/RandomUtils";

export class ObjectItem extends SupportItem {
	categoryName = "objects";

	public getCategory(): ItemCategory {
		return ItemCategory.OBJECT;
	}

	public getItemAddedValue(): number {
		return this.power;
	}
}

export class ObjectItemDataController extends ItemDataController<ObjectItem> {
	static readonly instance: ObjectItemDataController = new ObjectItemDataController("objects");

	newInstance(): ObjectItem {
		return new ObjectItem();
	}

	public randomItem(nature: number, rarity: number): ObjectItem {
		return RandomUtils.draftbotRandom.pick(this.getValuesArray()
			.filter((item) => item.nature === nature && item.rarity === rarity));
	}
}