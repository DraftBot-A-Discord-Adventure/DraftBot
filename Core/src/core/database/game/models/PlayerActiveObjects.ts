import { Weapon } from "../../../../data/Weapon";
import { Armor } from "../../../../data/Armor";
import { Potion } from "../../../../data/Potion";
import { ObjectItem } from "../../../../data/ObjectItem";

export interface PlayerActiveObjects {
	weapon: Weapon;
	armor: Armor;
	potion: Potion;
	object: ObjectItem;
}
