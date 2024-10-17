import {ItemNature, ItemRarity} from "../constants/ItemConstants";

export interface MainItemDisplayPacket {
	id: number,
	rarity: ItemRarity,
	attack: {
		value: number,
		maxValue: number
	},
	defense: {
		value: number,
		maxValue: number
	},
	speed: {
		value: number,
		maxValue: number
	},
}

export interface SupportItemDisplayPacket {
	id: number,
	rarity: number,
	nature: ItemNature,
	power: number,
	maxPower: number
}