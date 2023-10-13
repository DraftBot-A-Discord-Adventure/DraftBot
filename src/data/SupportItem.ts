import {GenericItem} from "./GenericItem";
import {Constants} from "../core/Constants";

export abstract class SupportItem extends GenericItem {
    declare readonly power: number;

    declare readonly nature: number;

    public getAttack(): number {
        return this.nature === Constants.ITEM_NATURE.ATTACK ? this.power : 0;
    }

    public getDefense(): number {
        return this.nature === Constants.ITEM_NATURE.DEFENSE ? this.power : 0;
    }

    public getSpeed(): number {
        return this.nature === Constants.ITEM_NATURE.SPEED ? this.power : 0;
    }
}
