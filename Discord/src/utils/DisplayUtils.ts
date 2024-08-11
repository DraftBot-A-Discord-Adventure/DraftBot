import {ItemCategory} from "../../../Lib/src/constants/ItemConstants";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import i18n from "../translations/i18n";
import {Language} from "../../../Lib/src/Language";

export class DisplayUtils {
	static getItemDisplay(itemCategory: ItemCategory, itemId: number, language: Language): string {
		switch (itemCategory) {
		case ItemCategory.WEAPON:
			return DisplayUtils.getWeaponDisplay(itemId, language);
		case ItemCategory.ARMOR:
			return DisplayUtils.getArmorDisplay(itemId, language);
		case ItemCategory.POTION:
			return DisplayUtils.getPotionDisplay(itemId, language);
		case ItemCategory.OBJECT:
			return DisplayUtils.getObjectDisplay(itemId, language);
		default:
			return "Missing no";
		}
	}

	static getWeaponDisplay(weaponId: number, language: Language): string {
		return `${DraftBotIcons.weapons[weaponId]} ${i18n.t(`models:weapons.${weaponId}`, { lng: language })}`;
	}

	static getArmorDisplay(armorId: number, language: Language): string {
		return `${DraftBotIcons.armors[armorId]} ${i18n.t(`models:armors.${armorId}`, { lng: language })}`;
	}

	static getPotionDisplay(potionId: number, language: Language): string {
		return `${DraftBotIcons.potions[potionId]} ${i18n.t(`models:potions.${potionId}`, { lng: language })}`;
	}

	static getObjectDisplay(objectId: number, language: Language): string {
		return `${DraftBotIcons.objects[objectId]} ${i18n.t(`models:objects.${objectId}`, { lng: language })}`;
	}
}