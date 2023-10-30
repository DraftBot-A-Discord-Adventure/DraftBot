import {Weapon} from "@Core/src/data/Weapon";
import {Armor} from "@Core/src/data/Armor";
import {Potion} from "@Core/src/data/Potion";
import {ObjectItem} from "@Core/src/data/ObjectItem";

export interface PlayerActiveObjects {
	weapon: Weapon,
	armor: Armor,
	potion: Potion,
	object: ObjectItem
}