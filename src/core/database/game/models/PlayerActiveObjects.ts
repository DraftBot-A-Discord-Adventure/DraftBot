import Weapon from "./Weapon";
import Armor from "./Armor";
import Potion from "./Potion";
import ObjectItem from "./ObjectItem";

export interface playerActiveObjects {
	weapon: Weapon,
	armor: Armor,
	potion: Potion,
	object: ObjectItem
}