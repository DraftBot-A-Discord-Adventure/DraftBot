import {Language} from "../../../Lib/src/Language";
import i18n from "../translations/i18n";
import {
	MainItemDisplayPacket,
	SupportItemDisplayPacket
} from "../../../Lib/src/packets/commands/CommandInventoryPacket";
import {EmbedField} from "discord.js";
import {ItemNature} from "../../../Lib/src/constants/ItemConstants";
import {minutesDisplay} from "../../../Lib/src/utils/TimeUtils";
import {MaxStatsValues} from "../../../Lib/src/types/MaxStatsValues";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import {EmoteUtils} from "./EmoteUtils";


type Value = {
	maxValue: number,
	value: number,
	typeValue: "attack" | "defense" | "speed"
}

export class DiscordItemUtils {
	/**
	 * Get a stat value of an item into its string form
	 * @param language
	 * @param values
	 * @param value
	 */
	static getStringValueFor(language: Language, values: string[], value: Value): void {
		if (value.value !== 0) {
			values.push(i18n.t(`items:${value.typeValue}`, {
				lng: language,
				value: value.maxValue >= value.value ? value.value : i18n.t("items:nerfDisplay", {
					lng: language,
					old: value.value,
					max: value.maxValue
				})
			}));
		}
	}

	/**
	 * Get the string for the stats of the main item
	 * @param attack
	 * @param defense
	 * @param speed
	 * @param language
	 * @param maxStatsValue
	 * @protected
	 */
	static getValues(attack: number, defense: number, speed: number, language: Language, maxStatsValue: MaxStatsValues | null = null): string {
		if (!maxStatsValue) {
			maxStatsValue = {
				attack: Infinity,
				defense: Infinity,
				speed: Infinity
			};
		}
		const values: string[] = [];
		DiscordItemUtils.getStringValueFor(language, values, {
			value: attack,
			maxValue: maxStatsValue.attack,
			typeValue: "attack"
		});
		DiscordItemUtils.getStringValueFor(language, values, {
			value: defense,
			maxValue: maxStatsValue.defense,
			typeValue: "defense"
		});
		DiscordItemUtils.getStringValueFor(language, values, {
			value: speed,
			maxValue: maxStatsValue.speed,
			typeValue: "speed"
		});
		return values.join(" ");
	}

	static getWeaponField(displayPacket: MainItemDisplayPacket, language: Language): EmbedField {
		const itemField: string = i18n.t("items:itemsField", {
			lng: language,
			name: i18n.t(`models:weapons.${displayPacket.id}`, {
				lng: language,
				interpolation: {escapeValue: false}
			}),
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.weapons[displayPacket.id]),
			rarity: i18n.t(`items:rarities.${displayPacket.rarity}`, {lng: language}),
			values: DiscordItemUtils.getValues(displayPacket.attack.value, displayPacket.defense.value, displayPacket.speed.value, language, {
				attack: displayPacket.attack.maxValue,
				defense: displayPacket.defense.maxValue,
				speed: displayPacket.speed.maxValue
			}),
			interpolation: {escapeValue: false}
		});
		return {
			name: i18n.t("items:weaponsFieldName", {lng: language}),
			value: displayPacket.id === 0 ? itemField.split("|")[0] : itemField,
			inline: false
		};
	}

	static getArmorField(displayPacket: MainItemDisplayPacket, language: Language): EmbedField {
		const itemField: string = i18n.t("items:itemsField", {
			lng: language,
			name: i18n.t(`models:armors.${displayPacket.id}`, {lng: language, interpolation: {escapeValue: false}}),
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.armors[displayPacket.id]),
			rarity: i18n.t(`items:rarities.${displayPacket.rarity}`, {lng: language}),
			values: DiscordItemUtils.getValues(displayPacket.attack.value, displayPacket.defense.value, displayPacket.speed.value, language, {
				attack: displayPacket.attack.maxValue,
				defense: displayPacket.defense.maxValue,
				speed: displayPacket.speed.maxValue
			}),
			interpolation: {escapeValue: false}
		});
		return {
			name: i18n.t("items:armorsFieldName", {lng: language}),
			value: displayPacket.id === 0 ? itemField.split("|")[0] : itemField,
			inline: false
		};
	}

	static getPotionField(displayPacket: SupportItemDisplayPacket, language: Language): EmbedField {
		const itemField: string = i18n.t("items:itemsField", {
			lng: language,
			name: i18n.t(`models:potions.${displayPacket.id}`, {
				lng: language,
				interpolation: {escapeValue: false}
			}),
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.potions[displayPacket.id]),
			rarity: i18n.t(`items:rarities.${displayPacket.rarity}`, {lng: language}),
			values: i18n.t(`items:potionsNatures.${displayPacket.nature}`, {
				lng: language,
				power: displayPacket.nature === ItemNature.TIME_SPEEDUP ? minutesDisplay(displayPacket.power, language) : displayPacket.power
			}),
			interpolation: {escapeValue: false}
		});
		return {
			name: i18n.t("items:potionsFieldName", {lng: language}),
			value: displayPacket.id === 0 ? itemField.split("|")[0] : itemField,
			inline: false
		};
	}

	static getObjectField(displayPacket: SupportItemDisplayPacket, language: Language): EmbedField {
		const natureTrKey = `items:objectsNatures.${displayPacket.nature}`;
		let nature;
		if (displayPacket.nature === ItemNature.TIME_SPEEDUP) {
			nature = i18n.t(natureTrKey, {lng: language, power: minutesDisplay(displayPacket.power, language)});
		}
		else if (displayPacket.nature === ItemNature.SPEED) {
			nature = i18n.t(natureTrKey, {
				lng: language,
				power: displayPacket.maxPower >= displayPacket.power ? displayPacket.power : i18n.t("items:nerfDisplay", {
					lng: language,
					old: displayPacket.power,
					max: displayPacket.maxPower
				})
			});
		}
		else {
			nature = i18n.t(natureTrKey, {lng: language, power: displayPacket.power});
		}
		const itemField: string = i18n.t("items:itemsField", {
			lng: language,
			name: i18n.t(`models:objects.${displayPacket.id}`, {
				lng: language,
				interpolation: {escapeValue: false}
			}),
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.objects[displayPacket.id]),
			rarity: i18n.t(`items:rarities.${displayPacket.rarity}`, {lng: language}),
			values: nature,
			interpolation: {escapeValue: false}
		});
		return {
			name: i18n.t("items:objectsFieldName", {lng: language}),
			value: displayPacket.id === 0 ? itemField.split("|")[0] : itemField,
			inline: false
		};
	}
}