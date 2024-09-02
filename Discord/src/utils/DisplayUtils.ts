import {ItemCategory, ItemNature} from "../../../Lib/src/constants/ItemConstants";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import i18n from "../translations/i18n";
import {Language} from "../../../Lib/src/Language";
import {ItemWithDetails} from "../../../Lib/src/interfaces/ItemWithDetails";
import {minutesDisplay} from "../../../Lib/src/utils/TimeUtils";
import {Item} from "../../../Lib/src/interfaces/Item";

export class DisplayUtils {
	static getItemDisplay(item: Item, language: Language): string {
		switch (item.category) {
		case ItemCategory.WEAPON:
			return DisplayUtils.getWeaponDisplay(item.id, language);
		case ItemCategory.ARMOR:
			return DisplayUtils.getArmorDisplay(item.id, language);
		case ItemCategory.POTION:
			return DisplayUtils.getPotionDisplay(item.id, language);
		case ItemCategory.OBJECT:
			return DisplayUtils.getObjectDisplay(item.id, language);
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

	static getItemDisplayWithStats(itemWithDetails: ItemWithDetails, language: Language): string {
		switch (itemWithDetails.category) {
		case ItemCategory.WEAPON:
			return `${DraftBotIcons.weapons[itemWithDetails.id]}  ${this.getMainItemDisplayWithStats("weapons", itemWithDetails, language)}`;
		case ItemCategory.ARMOR:
			return `${DraftBotIcons.armors[itemWithDetails.id]}  ${this.getMainItemDisplayWithStats("armor", itemWithDetails, language)}`;
		case ItemCategory.POTION:
			return `${DraftBotIcons.potions[itemWithDetails.id]}  ${this.getPotionDisplayWithStats(itemWithDetails, language)}`;
		case ItemCategory.OBJECT:
			return `${DraftBotIcons.objects[itemWithDetails.id]}  ${this.getObjectDisplayWithStats(itemWithDetails, language)}`;
		default:
			return "Missing no";
		}
	}

	private static getStringValueFor(values: string[], maxValue: number | null, value: number, typeValue: "attack" | "defense" | "speed", lng: Language): void {
		if (value !== 0) {
			values.push(i18n.t(`items:${typeValue}`, {
				value: maxValue ?? Infinity >= value ? value : i18n.t("items:nerfDisplay", {
					old: value,
					max: maxValue,
					lng
				}),
				lng
			}));
		}
	}

	private static getMainItemDisplayWithStats(itemType: "weapons" | "armor", itemWithDetails: ItemWithDetails, language: Language): string {
		const values: string[] = [];
		this.getStringValueFor(values, itemWithDetails.maxStats?.attack ?? null, itemWithDetails.detailsMainItem!.stats.attack, "attack", language);
		this.getStringValueFor(values, itemWithDetails.maxStats?.defense ?? null, itemWithDetails.detailsMainItem!.stats.defense, "defense", language);
		this.getStringValueFor(values, itemWithDetails.maxStats?.speed ?? null, itemWithDetails.detailsMainItem!.stats.speed, "speed", language);
		return i18n.t(`items:${itemType}.fieldValue`, {
			lng: language,
			name: i18n.t(`models:${itemType}.` + itemWithDetails.id, { lng: language, interpolation: { escapeValue: false } }),
			rarity: i18n.t("items:rarities." + itemWithDetails.rarity, { lng: language }),
			values: values.join(" "),
			interpolation: { escapeValue: false }
		});
	}

	private static getPotionDisplayWithStats(itemWithDetails: ItemWithDetails, language: Language): string {
		const name = i18n.t(`models:potions.${itemWithDetails.id}`, { lng: language, interpolation: { escapeValue: false } });
		return itemWithDetails.id === 0 ? name : i18n.t("items:potions.fieldValue", {
			name,
			rarity: i18n.t("items:rarities." + itemWithDetails.rarity, { lng: language }),
			nature: i18n.t(`items:potions.natures.${itemWithDetails.detailsSupportItem!.nature}`, {
				power: itemWithDetails.detailsSupportItem!.nature === ItemNature.TIME_SPEEDUP ? minutesDisplay(itemWithDetails.detailsSupportItem!.power) : itemWithDetails.detailsSupportItem!.power,
				lng: language
			}),
			interpolation: { escapeValue: false }
		});
	}

	private static getObjectNatureTranslation(itemWithDetails: ItemWithDetails, lng: string): string {
		let maxStatsValue = itemWithDetails.maxStats ?? null;
		if (itemWithDetails.maxStats === null) {
			maxStatsValue = {attack: Infinity, defense: Infinity, speed: Infinity};
		}

		if (itemWithDetails.detailsSupportItem!.nature === ItemNature.TIME_SPEEDUP) {
			return i18n.t(`items:objects.natures.${itemWithDetails.detailsSupportItem!.nature}`, {
				power: minutesDisplay(itemWithDetails.detailsSupportItem!.power),
				lng
			});
		}

		if (itemWithDetails.detailsSupportItem!.nature === ItemNature.SPEED) {
			const speedDisplay = maxStatsValue!.speed >= itemWithDetails.detailsSupportItem!.power / 2 ? itemWithDetails.detailsSupportItem!.power : i18n.t("items:nerfDisplay", {
				old: itemWithDetails.detailsSupportItem!.power,
				max: maxStatsValue!.speed * 2,
				lng
			});
			return i18n.t(`items:objects.natures.${itemWithDetails.detailsSupportItem!.nature}`, {
				power: speedDisplay,
				lng
			});
		}

		return i18n.t(`items:objects.natures.${itemWithDetails.detailsSupportItem!.nature}`, {
			power: itemWithDetails.detailsSupportItem!.power,
			lng
		});
	}

	private static getObjectDisplayWithStats(itemWithDetails: ItemWithDetails, language: Language): string {
		const name = i18n.t(`models:objects.${itemWithDetails.id}`, { lng: language, interpolation: { escapeValue: false } });
		return i18n.t("items:objects.fieldValue", {
			name,
			rarity: i18n.t("items:rarities." + itemWithDetails.rarity, { lng: language }),
			nature: DisplayUtils.getObjectNatureTranslation(itemWithDetails, language),
			interpolation: { escapeValue: false }
		});
	}
}