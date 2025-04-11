import {
	ItemCategory, itemCategoryToString, ItemNature
} from "../../../Lib/src/constants/ItemConstants";
import { DraftBotIcons } from "../../../Lib/src/DraftBotIcons";
import i18n from "../translations/i18n";
import { Language } from "../../../Lib/src/Language";
import { ItemWithDetails } from "../../../Lib/src/types/ItemWithDetails";
import { minutesDisplay } from "../../../Lib/src/utils/TimeUtils";
import { Item } from "../../../Lib/src/types/Item";
import { EmoteUtils } from "./EmoteUtils";
import {
	SexTypeShort, StringConstants
} from "../../../Lib/src/constants/StringConstants";
import { OwnedPet } from "../../../Lib/src/types/OwnedPet";
import { PetFood } from "../../../Lib/src/types/PetFood";
import { StringUtils } from "./StringUtils";

export class DisplayUtils {
	/**
	 * Display the item name with its icon
	 * @param item
	 * @param language
	 */
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

	static getSimpleItemName(item: Item, lng: Language): string {
		return i18n.t(`models:${itemCategoryToString(item.category)}.${item.id}`, { lng });
	}

	static getItemIcon(item: Item): string {
		switch (item.category) {
			case ItemCategory.WEAPON:
				return DraftBotIcons.weapons[item.id];
			case ItemCategory.ARMOR:
				return DraftBotIcons.armors[item.id];
			case ItemCategory.POTION:
				return DraftBotIcons.potions[item.id];
			case ItemCategory.OBJECT:
				return DraftBotIcons.objects[item.id];
			default:
				return "Missing no";
		}
	}

	/**
	 * Display the item name with its icon
	 * @param weaponId
	 * @param lng
	 */
	static getWeaponDisplay(weaponId: number, lng: Language): string {
		return `${DraftBotIcons.weapons[weaponId]} ${i18n.t(`models:weapons.${weaponId}`, { lng })}`;
	}

	/**
	 * Display the item name with its icon
	 * @param armorId
	 * @param lng
	 */
	static getArmorDisplay(armorId: number, lng: Language): string {
		return `${DraftBotIcons.armors[armorId]} ${i18n.t(`models:armors.${armorId}`, { lng })}`;
	}

	/**
	 * Display the potion name with its icon
	 * @param potionId
	 * @param lng
	 */
	static getPotionDisplay(potionId: number, lng: Language): string {
		return `${DisplayUtils.getItemIcon({
			category: ItemCategory.POTION,
			id: potionId
		})} ${i18n.t(`models:potions.${potionId}`, { lng })}`;
	}

	/**
	 * Display the object name with its icon
	 * @param objectId
	 * @param lng
	 */
	static getObjectDisplay(objectId: number, lng: Language): string {
		return `${DraftBotIcons.objects[objectId]} ${i18n.t(`models:objects.${objectId}`, { lng })}`;
	}

	/**
	 * Display the item name with its icon and stats
	 * @param itemWithDetails
	 * @param language
	 */
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

	/**
	 * Display the emote of a map location + its name
	 * @param mapType
	 * @param mapLocationId
	 * @param lng
	 */
	static getMapLocationDisplay(mapType: string, mapLocationId: number, lng: Language): string {
		return i18n.t("{emote:mapTypes.{{mapType}}} $t(models:map_locations.{{mapLocationId}}.name)", {
			lng,
			mapLocationId,
			mapType
		});
	}

	/**
	 * Display the icon of a pet
	 * @param petId
	 * @param sex
	 */
	static getPetIcon(petId: number, sex: SexTypeShort): string {
		return DraftBotIcons.pets[petId][sex === StringConstants.SEX.FEMALE.short ? "emoteFemale" : "emoteMale"];
	}

	/**
	 * Get the name of an animal type linked to a pet in the specified language
	 * @param lng
	 * @param typeId
	 * @param sex
	 */
	static getPetTypeName(lng: Language, typeId: number, sex: SexTypeShort): string {
		const sexStringContext: string = sex === StringConstants.SEX.MALE.short ? StringConstants.SEX.MALE.long : StringConstants.SEX.FEMALE.long;
		return i18n.t(
			`models:pets:${typeId}`,
			{
				lng,
				context: sexStringContext
			}
		);
	}

	/**
	 * Display the emote of a pet + its name
	 * @param petId
	 * @param sex
	 * @param lng
	 */
	static getPetDisplay(petId: number, sex: SexTypeShort, lng: Language): string {
		const context = sex === StringConstants.SEX.FEMALE.short ? StringConstants.SEX.FEMALE.long : StringConstants.SEX.MALE.long;
		return i18n.t(`{emote:pets.{{petId}}.emote${context[0].toUpperCase() + context.slice(1)}} $t(models:pets.{{petId}})`, {
			lng,
			context,
			petId
		});
	}

	static getPetNicknameOrTypeName(nickname: string | null, typeId: number, sex: SexTypeShort, lng: Language): string {
		return nickname ? DisplayUtils.getPetDisplayNickname(lng, nickname) : DisplayUtils.getPetTypeName(lng, typeId, sex);
	}

	/**
	 * Display the pet's information as a single line with the pet's icon and name (nickname or type name)
	 * @param ownedPet
	 * @param lng
	 */
	static getOwnedPetInlineDisplay(ownedPet: OwnedPet, lng: Language): string {
		return `${DisplayUtils.getPetIcon(ownedPet.typeId, ownedPet.sex)} ${DisplayUtils.getPetNicknameOrTypeName(ownedPet.nickname, ownedPet.typeId, ownedPet.sex, lng)}`;
	}

	/**
	 * Display the nickname of a pet or a default message if it has no nickname
	 * @param lng
	 * @param nickname
	 */
	static getPetDisplayNickname(lng: Language, nickname: string): string {
		return nickname ? nickname : i18n.t("commands:pet.noNickname", { lng });
	}

	/**
	 * Display the stars corresponding to the rarity of a pet
	 * @param rarity
	 */
	static getPetRarityDisplay(rarity: number): string {
		return DraftBotIcons.unitValues.petRarity.repeat(rarity);
	}

	/**
	 * Display the sex icon of a pet
	 * @param sex
	 * @param lng
	 */
	static getPetSexName(sex: SexTypeShort, lng: Language): string {
		return sex === "f" ? i18n.t("models:sex.female", { lng }) : i18n.t("models:sex.male", { lng });
	}

	/**
	 * Display the adjective corresponding to the love level of a pet
	 * @param loveLevel
	 * @param sex
	 * @param lng
	 * @param withIcon
	 */
	static getPetLoveLevelDisplay(loveLevel: number, sex: SexTypeShort, lng: Language, withIcon = true): string {
		const sexStringContext: string = sex === StringConstants.SEX.MALE.short ? StringConstants.SEX.MALE.long : StringConstants.SEX.FEMALE.long;
		const text = i18n.t(`commands:pet.loveLevels.${loveLevel}`, {
			context: sexStringContext as unknown,
			lng
		});

		if (withIcon) {
			return text;
		}

		return text.split(" ")[1];
	}

	/**
	 * Display the pet's information as a field with line breaks and values followed by colons (name, rarity, sex, love level)
	 * @param ownedPet
	 * @param lng
	 */
	static getOwnedPetFieldDisplay(ownedPet: OwnedPet, lng: Language): string {
		return i18n.t("commands:pet.petField", {
			lng,
			emote: DisplayUtils.getPetIcon(ownedPet.typeId, ownedPet.sex),
			typeName: DisplayUtils.getPetTypeName(lng, ownedPet.typeId, ownedPet.sex),
			nickname: DisplayUtils.getPetDisplayNickname(lng, ownedPet.nickname),
			rarity: DisplayUtils.getPetRarityDisplay(ownedPet.rarity),
			sex: i18n.t("commands:pet.sexDisplay", {
				lng,
				context: ownedPet.sex
			}),
			loveLevel: DisplayUtils.getPetLoveLevelDisplay(ownedPet.loveLevel, ownedPet.sex, lng)
		});
	}

	/**
	 * Return the string of a class
	 * @param classId
	 * @param lng
	 */
	static getClassDisplay(classId: number, lng: Language): string {
		return i18n.t("models:classFormat", {
			lng,
			id: classId
		});
	}

	/**
	 * Return the string of food with its icon
	 * @param food
	 * @param count
	 * @param lng
	 * @param capitalizeFirstLetter
	 */
	static getFoodDisplay(food: PetFood, count: number, lng: Language, capitalizeFirstLetter: boolean): string {
		let name = i18n.t(`models:foods.${food}`, {
			lng,
			count
		});
		if (capitalizeFirstLetter) {
			name = StringUtils.capitalizeFirstLetter(name);
		}
		return `${DraftBotIcons.foods[food]} ${name}`;
	}

	private static getStringValueFor(values: string[], maxValue: number | null, value: number, typeValue: "attack" | "defense" | "speed", lng: Language): void {
		if (value !== 0) {
			values.push(i18n.t(`items:${typeValue}`, {
				lng,
				value: maxValue ?? Infinity >= value
					? value
					: i18n.t("items:nerfDisplay", {
						old: value,
						max: maxValue,
						lng
					})
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
			name: i18n.t(`models:${itemType}.${itemWithDetails.id}`, {
				lng,
				interpolation: { escapeValue: false }
			}),
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons[itemType][itemWithDetails.id]),
			rarity: i18n.t(`items:rarities.${itemWithDetails.rarity}`, { lng }),
			values: values.join(" "),
			interpolation: { escapeValue: false }
		});
	}

	private static getPotionDisplayWithStats(itemWithDetails: ItemWithDetails, lng: Language): string {
		const itemField: string = i18n.t("items:itemsField", {
			name: i18n.t(`models:potions.${itemWithDetails.id}`, {
				lng,
				interpolation: { escapeValue: false }
			}),
			emote: EmoteUtils.translateEmojiToDiscord(DisplayUtils.getItemIcon({
				category: itemWithDetails.category,
				id: itemWithDetails.id
			})),
			rarity: i18n.t(`items:rarities.${itemWithDetails.rarity}`, { lng }),
			values: i18n.t(`items:potionsNatures.${itemWithDetails.detailsSupportItem!.nature}`, {
				power: itemWithDetails.detailsSupportItem!.nature === ItemNature.TIME_SPEEDUP ? minutesDisplay(itemWithDetails.detailsSupportItem!.power) : itemWithDetails.detailsSupportItem!.power,
				lng
			}),
			interpolation: { escapeValue: false },
			lng
		});
		return itemWithDetails.id === 0 ? itemField.split("|")[0] : itemField;
	}

	private static getObjectNatureTranslation(itemWithDetails: ItemWithDetails, lng: Language): string {
		let maxStatsValue = itemWithDetails.maxStats ?? null;
		if (itemWithDetails.maxStats === null) {
			maxStatsValue = {
				attack: Infinity,
				defense: Infinity,
				speed: Infinity
			};
		}

		if (itemWithDetails.detailsSupportItem!.nature === ItemNature.TIME_SPEEDUP) {
			return i18n.t(`items:objectsNatures.${itemWithDetails.detailsSupportItem!.nature}`, {
				power: minutesDisplay(itemWithDetails.detailsSupportItem!.power),
				lng
			});
		}

		if (itemWithDetails.detailsSupportItem!.nature === ItemNature.SPEED) {
			const speedDisplay = maxStatsValue!.speed >= itemWithDetails.detailsSupportItem!.power / 2
				? itemWithDetails.detailsSupportItem!.power
				: i18n.t("items:nerfDisplay", {
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
				interpolation: { escapeValue: false }
			}),
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.objects[itemWithDetails.id]),
			rarity: i18n.t(`items:rarities.${itemWithDetails.rarity}`, { lng }),
			values: DisplayUtils.getObjectNatureTranslation(itemWithDetails, lng),
			lng,
			interpolation: { escapeValue: false }
		});
		return itemWithDetails.id === 0 ? itemField.split("|")[0] : itemField;
	}
}
