import {ItemCategory, ItemNature} from "../../../Lib/src/constants/ItemConstants";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import i18n from "../translations/i18n";
import {LANGUAGE, Language} from "../../../Lib/src/Language";
import {ItemWithDetails} from "../../../Lib/src/interfaces/ItemWithDetails";
import {minutesDisplay} from "../../../Lib/src/utils/TimeUtils";
import {Item} from "../../../Lib/src/interfaces/Item";
import {EmoteUtils} from "./EmoteUtils";
import {PetConstants} from "../../../Lib/src/constants/PetConstants";

export class DisplayUtils {

	/**
	 * Display food with its icon
	 * @param foodId String id of the food (herbivorousFood, carnivorousFood, commonFood or ultimateFood)
	 * @param lng
	 */
	static displayFood(foodId: string, lng: Language): string {
		return `${i18n.t(`models:foods.${foodId}`, {lng})}  ${DraftBotIcons.foods[foodId]}`;
	}

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

	static getWeaponDisplay(weaponId: number, lng: Language): string {
		return `${DraftBotIcons.weapons[weaponId]} ${i18n.t(`models:weapons.${weaponId}`, {lng})}`;
	}

	static getArmorDisplay(armorId: number, lng: Language): string {
		return `${DraftBotIcons.armors[armorId]} ${i18n.t(`models:armors.${armorId}`, {lng})}`;
	}

	static getPotionDisplay(potionId: number, lng: Language): string {
		return `${DraftBotIcons.potions[potionId]} ${i18n.t(`models:potions.${potionId}`, {lng})}`;
	}

	static getObjectDisplay(objectId: number, lng: Language): string {
		return `${DraftBotIcons.objects[objectId]} ${i18n.t(`models:objects.${objectId}`, {lng})}`;
	}

	static getItemDisplayWithStats(itemWithDetails: ItemWithDetails, language: Language): string {
		switch (itemWithDetails.category) {
		case ItemCategory.WEAPON:
			return this.getMainItemDisplayWithStats("weapons", itemWithDetails, language);
		case ItemCategory.ARMOR:
			return this.getMainItemDisplayWithStats("armors", itemWithDetails, language);
		case ItemCategory.POTION:
			return this.getPotionDisplayWithStats(itemWithDetails, language);
		case ItemCategory.OBJECT:
			return this.getObjectDisplayWithStats(itemWithDetails, language);
		default:
			return "Missing no";
		}
	}

	static getMapLocationDisplay(mapType: string, mapLocationId: number, lng: Language): string {
		return i18n.t("{emote:map_types{{mapType}}} $t(models:map_locations.{{mapLocationId}}.name)", {
			lng,
			mapLocationId,
			mapType
		});
	}

	static getPetIcon(petId: number, isFemale: boolean): string {
		return i18n.t(`{emote:pets.{{petId}}.emote${isFemale ? "Female" : "Male"}}`, {
			lng: LANGUAGE.DEFAULT_LANGUAGE,
			petId
		});
	}

	static getPetDisplay(petId: number, isFemale: boolean, lng: Language): string {
		const context = isFemale ? PetConstants.SEX.FEMALE_FULL : PetConstants.SEX.MALE_FULL;
		return i18n.t(`{emote:pets.{{petId}}.emote${context[0].toUpperCase() + context.slice(1)}} $t(models:pets.{{petId}})`, {
			lng,
			context,
			petId
		});
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

	private static getMainItemDisplayWithStats(itemType: "weapons" | "armors", itemWithDetails: ItemWithDetails, lng: Language): string {
		const values: string[] = [];
		this.getStringValueFor(values, itemWithDetails.maxStats?.attack ?? null, itemWithDetails.detailsMainItem!.stats.attack, "attack", lng);
		this.getStringValueFor(values, itemWithDetails.maxStats?.defense ?? null, itemWithDetails.detailsMainItem!.stats.defense, "defense", lng);
		this.getStringValueFor(values, itemWithDetails.maxStats?.speed ?? null, itemWithDetails.detailsMainItem!.stats.speed, "speed", lng);
		return i18n.t("items:itemsField", {
			lng,
			name: i18n.t(`models:${itemType}.` + itemWithDetails.id, {
				lng,
				interpolation: {escapeValue: false}
			}),
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons[itemType][itemWithDetails.id]),
			rarity: i18n.t("items:rarities." + itemWithDetails.rarity, {lng}),
			values: values.join(" "),
			interpolation: {escapeValue: false}
		});
	}

	private static getPotionDisplayWithStats(itemWithDetails: ItemWithDetails, lng: Language): string {
		const itemField: string = i18n.t("items:itemsField", {
			name: i18n.t(`models:potions.${itemWithDetails.id}`, {lng, interpolation: {escapeValue: false}}),
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.potions[itemWithDetails.id]),
			rarity: i18n.t("items:rarities." + itemWithDetails.rarity, {lng}),
			values: i18n.t(`items:potionsNatures.${itemWithDetails.detailsSupportItem!.nature}`, {
				power: itemWithDetails.detailsSupportItem!.nature === ItemNature.TIME_SPEEDUP ? minutesDisplay(itemWithDetails.detailsSupportItem!.power) : itemWithDetails.detailsSupportItem!.power,
				lng
			}),
			interpolation: {escapeValue: false},
			lng
		});
		return itemWithDetails.id === 0 ? itemField.split("|")[0] : itemField;
	}

	private static getObjectNatureTranslation(itemWithDetails: ItemWithDetails, lng: Language): string {
		let maxStatsValue = itemWithDetails.maxStats ?? null;
		if (itemWithDetails.maxStats === null) {
			maxStatsValue = {attack: Infinity, defense: Infinity, speed: Infinity};
		}

		if (itemWithDetails.detailsSupportItem!.nature === ItemNature.TIME_SPEEDUP) {
			return i18n.t(`items:objectsNatures.${itemWithDetails.detailsSupportItem!.nature}`, {
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
			return i18n.t(`items:objectsNatures.${itemWithDetails.detailsSupportItem!.nature}`, {
				power: speedDisplay,
				lng
			});
		}

		return i18n.t(`items:objectsNatures.${itemWithDetails.detailsSupportItem!.nature}`, {
			power: itemWithDetails.detailsSupportItem!.power,
			lng
		});
	}

	private static getObjectDisplayWithStats(itemWithDetails: ItemWithDetails, lng: Language): string {
		const itemField: string = i18n.t("items:itemsField", {
			name: i18n.t(`models:objects.${itemWithDetails.id}`, {
				lng,
				interpolation: {escapeValue: false}
			}),
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.objects[itemWithDetails.id]),
			rarity: i18n.t(`items:rarities.${itemWithDetails.rarity}`, {lng}),
			values: DisplayUtils.getObjectNatureTranslation(itemWithDetails, lng),
			lng,
			interpolation: {escapeValue: false}
		});
		return itemWithDetails.id === 0 ? itemField.split("|")[0] : itemField;
	}
}