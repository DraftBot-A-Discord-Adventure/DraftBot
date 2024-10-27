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
	 * @param lng
	 * @param values
	 * @param value
	 */
	static getStringValueFor(lng: Language, values: string[], value: Value): void {
		if (value.value !== 0) {
			values.push(i18n.t(`items:${value.typeValue}`, {
				lng,
				value: value.maxValue >= value.value ? value.value : i18n.t("items:nerfDisplay", {
					lng,
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

	static getWeaponField(displayPacket: MainItemDisplayPacket, lng: Language): EmbedField {
		const itemField: string = i18n.t("items:itemsField", {
			lng,
			name: i18n.t(`models:weapons.${displayPacket.id}`, {
				lng,
				interpolation: {escapeValue: false}
			}),
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.weapons[displayPacket.id]),
			rarity: i18n.t(`items:rarities.${displayPacket.rarity}`, {lng}),
			values: DiscordItemUtils.getValues(displayPacket.attack.value, displayPacket.defense.value, displayPacket.speed.value, lng, {
				attack: displayPacket.attack.maxValue,
				defense: displayPacket.defense.maxValue,
				speed: displayPacket.speed.maxValue
			}),
			interpolation: {escapeValue: false}
		});
		return {
			name: i18n.t("items:weaponsFieldName", {lng}),
			value: displayPacket.id === 0 ? itemField.split("|")[0] : itemField,
			inline: false
		};
	}

	static getArmorField(displayPacket: MainItemDisplayPacket, lng: Language): EmbedField {
		const itemField: string = i18n.t("items:itemsField", {
			lng,
			name: i18n.t(`models:armors.${displayPacket.id}`, {lng, interpolation: {escapeValue: false}}),
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.armors[displayPacket.id]),
			rarity: i18n.t(`items:rarities.${displayPacket.rarity}`, {lng}),
			values: DiscordItemUtils.getValues(displayPacket.attack.value, displayPacket.defense.value, displayPacket.speed.value, lng, {
				attack: displayPacket.attack.maxValue,
				defense: displayPacket.defense.maxValue,
				speed: displayPacket.speed.maxValue
			}),
			interpolation: {escapeValue: false}
		});
		return {
			name: i18n.t("items:armorsFieldName", {lng}),
			value: displayPacket.id === 0 ? itemField.split("|")[0] : itemField,
			inline: false
		};
	}

	static getPotionField(displayPacket: SupportItemDisplayPacket, lng: Language): EmbedField {
		const itemField: string = i18n.t("items:itemsField", {
			lng,
			name: i18n.t(`models:potions.${displayPacket.id}`, {
				lng,
				interpolation: {escapeValue: false}
			}),
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.potions[displayPacket.id]),
			rarity: i18n.t(`items:rarities.${displayPacket.rarity}`, {lng}),
			values: i18n.t(`items:potionsNatures.${displayPacket.nature}`, {
				lng,
				power: displayPacket.nature === ItemNature.TIME_SPEEDUP ? minutesDisplay(displayPacket.power, lng) : displayPacket.power
			}),
			interpolation: {escapeValue: false}
		});
		return {
			name: i18n.t("items:potionsFieldName", {lng}),
			value: displayPacket.id === 0 ? itemField.split("|")[0] : itemField,
			inline: false
		};
	}

	static getObjectField(displayPacket: SupportItemDisplayPacket, lng: Language): EmbedField {
		const natureTrKey = `items:objectsNatures.${displayPacket.nature}`;
		let nature;
		if (displayPacket.nature === ItemNature.TIME_SPEEDUP) {
			nature = i18n.t(natureTrKey, {lng, power: minutesDisplay(displayPacket.power, lng)});
		}
		else if (displayPacket.nature === ItemNature.SPEED) {
			nature = i18n.t(natureTrKey, {
				lng,
				power: displayPacket.maxPower >= displayPacket.power ? displayPacket.power : i18n.t("items:nerfDisplay", {
					lng,
					old: displayPacket.power,
					max: displayPacket.maxPower
				})
			});
		}
		else {
			nature = i18n.t(natureTrKey, {lng, power: displayPacket.power});
		}
		const itemField: string = i18n.t("items:itemsField", {
			lng,
			name: i18n.t(`models:objects.${displayPacket.id}`, {
				lng,
				interpolation: {escapeValue: false}
			}),
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.objects[displayPacket.id]),
			rarity: i18n.t(`items:rarities.${displayPacket.rarity}`, {lng}),
			values: nature,
			interpolation: {escapeValue: false}
		});
		return {
			name: i18n.t("items:objectsFieldName", {lng}),
			value: displayPacket.id === 0 ? itemField.split("|")[0] : itemField,
			inline: false
		};
	}
}