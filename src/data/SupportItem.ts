import {GenericItem} from "./GenericItem";
import {ItemNature} from "../core/constants/ItemConstants";

export abstract class SupportItem extends GenericItem {
	declare readonly power: number;

	declare readonly nature: number;

	public getAttack(): number {
		return this.nature === ItemNature.ATTACK ? this.power : 0;
	}

	public getDefense(): number {
		return this.nature === ItemNature.DEFENSE ? this.power : 0;
	}

	public getSpeed(): number {
		return this.nature === ItemNature.SPEED ? this.power : 0;
	}
}
