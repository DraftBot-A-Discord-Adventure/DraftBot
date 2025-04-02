import { ItemCategory } from "../../../Lib/src/constants/ItemConstants";
import { ItemDataController } from "./DataController";
import { SupportItem } from "./SupportItem";
import { RandomUtils } from "../../../Lib/src/utils/RandomUtils";
import { SupportItemDisplayPacket } from "../../../Lib/src/packets/commands/CommandInventoryPacket";
import { StatValues } from "../../../Lib/src/types/StatValues";

export class ObjectItem extends SupportItem {
	categoryName = "objects";

	public getCategory(): ItemCategory {
		return ItemCategory.OBJECT;
	}

	public getItemAddedValue(): number {
		return this.power;
	}

	public getDisplayPacket(maxStatsValue: StatValues = {
		attack: Infinity,
		defense: Infinity,
		speed: Infinity
	}): SupportItemDisplayPacket {
		let maxPower = this.power;
		if (maxStatsValue.speed >= this.power / 2) {
			maxPower = this.power;
		}
		return {
			itemCategory: this.getCategory(),
			maxPower,
			nature: this.nature,
			power: this.power,
			rarity: this.rarity,
			id: this.id
		};
	}
}

export class ObjectItemDataController extends ItemDataController<ObjectItem> {
	static readonly instance: ObjectItemDataController = new ObjectItemDataController("objects");

	newInstance(): ObjectItem {
		return new ObjectItem();
	}

	public randomItem(nature: number, rarity: number): ObjectItem {
		return RandomUtils.draftbotRandom.pick(this.getValuesArray()
			.filter(item => item.nature === nature && item.rarity === rarity));
	}
}
