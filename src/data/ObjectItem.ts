import {ItemConstants} from "../core/constants/ItemConstants";
import {DataController, ItemDataController} from "./DataController";
import {SupportItem} from "./SupportItem";
import {RandomUtils} from "../core/utils/RandomUtils";

export class ObjectItem extends SupportItem {
    categoryName = "objects";

    public getCategory(): number {
        return ItemConstants.CATEGORIES.OBJECT;
    }

    public getItemAddedValue(): number {
        return this.power;
    }
}

export class ObjectItemDataController extends ItemDataController<number, ObjectItem> {
    static readonly instance: ObjectItemDataController = new ObjectItemDataController("objects");

    newInstance(): ObjectItem {
        return new ObjectItem();
    }

    public randomItem(nature: number, rarity: number): ObjectItem {
        return RandomUtils.draftbotRandom.pick(this.getValuesArray().filter((item) => item.nature === nature && item.rarity === rarity));
    }
}