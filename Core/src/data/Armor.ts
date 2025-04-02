import { MainItem } from "./MainItem";
import { ItemCategory } from "../../../Lib/src/constants/ItemConstants";
import { ItemDataController } from "./DataController";

export class Armor extends MainItem {
	categoryName = "armors";

	public getAttack(): number {
		let before = 0;
		if (this.rawAttack > 0) {
			before = 1.15053 * Math.pow(this.multiplier(), 2.3617) * Math.pow(1.0569 + 0.1448 / this.multiplier(), this.rawAttack);
		}
		return Math.round(before * 0.75) + (this.attack ?? 0);
	}

	public getCategory(): ItemCategory {
		return ItemCategory.ARMOR;
	}

	public getDefense(): number {
		return Math.round(1.15053 * Math.pow(this.multiplier(), 2.3617) * Math.pow(1.0569 + 0.1448 / this.multiplier(), this.rawDefense)) + (this.defense ?? 0);
	}

	public getItemAddedValue(): number {
		return this.rawDefense;
	}
}

export class ArmorDataController extends ItemDataController<Armor> {
	static readonly instance: ArmorDataController = new ArmorDataController("armors");

	newInstance(): Armor {
		return new Armor();
	}
}
