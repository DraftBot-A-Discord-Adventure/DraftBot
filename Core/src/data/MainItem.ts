import { GenericItem } from "./GenericItem";
import { MainItemDisplayPacket } from "../../../Lib/src/packets/commands/CommandInventoryPacket";
import { StatValues } from "../../../Lib/src/types/StatValues";
import { InventoryConstants } from "../../../Lib/src/constants/InventoryConstants";

export abstract class MainItem extends GenericItem {
	public readonly rawAttack?: number;

	public readonly rawDefense?: number;

	public readonly rawSpeed?: number;

	public readonly attack?: number;

	public readonly defense?: number;

	public readonly speed?: number;


	public getSpeed(): number {
		let before = 0;
		if (this.rawSpeed > 0) {
			before = 1.15053 * Math.pow(this.multiplier(), 2.3617) * Math.pow(1.0569 + 0.1448 / this.multiplier(), this.rawSpeed);
		}
		return Math.round(before * 0.5) + (this.speed ?? 0);
	}

	public getDisplayPacket(maxStatsValue: StatValues = {
		attack: Infinity,
		defense: Infinity,
		speed: Infinity
	}): MainItemDisplayPacket {
		return {
			itemCategory: this.getCategory(),
			attack: {
				value: this.getAttack(),
				maxValue: maxStatsValue.attack
			},
			defense: {
				value: this.getDefense(),
				maxValue: maxStatsValue.defense
			},
			speed: {
				value: this.getSpeed(),
				maxValue: maxStatsValue.speed
			},
			rarity: this.rarity,
			id: this.id
		};
	}

	/**
	 * Get the multiplier for the item depending on its rarity
	 */
	protected multiplier(): number {
		return InventoryConstants.ITEMS_MAPPER[this.rarity];
	}
}
