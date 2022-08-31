import {DataTypes} from "sequelize";
import {TranslationModule, Translations} from "../../../Translations";
import {GenericItemModel, MaxStatsValues} from "./GenericItemModel";
import {EmbedField} from "discord.js";
import {InventoryConstants} from "../../../constants/InventoryConstants";
import moment = require("moment");

type Value = {
	maxValue: number,
	value: number,
	typeValue: string
}

/**
 * Get a stat value of an item into its string form
 * @param tr
 * @param values
 * @param value
 */
function getStringValueFor(tr: TranslationModule, values: string[], value: Value): void {
	if (value.value !== 0) {
		values.push(tr.format(value.typeValue, {
			value: value.maxValue >= value.value ? value.value : tr.format("nerfDisplay",
				{
					old: value.value,
					max: value.maxValue
				})
		}));
	}
}

export abstract class MainItemModel extends GenericItemModel {

	public readonly rawAttack!: number;

	public readonly rawDefense!: number;

	public readonly rawSpeed!: number;

	public readonly attack!: number;

	public readonly defense!: number;

	public readonly speed!: number;


	public toFieldObject(language: string, maxStatsValue: MaxStatsValues): EmbedField {
		const tr = Translations.getModule("items", language);
		const name = this.getName(language);
		return {
			name: tr.get(this.categoryName + ".fieldName"),
			value: this.id === 0 ? name : tr.format(`${this.categoryName}.fieldValue`, {
				name,
				rarity: this.getRarityTranslation(language),
				values: this.getValues(language, maxStatsValue)
			}),
			inline: false
		};
	}

	public toString(language: string): string {
		const tr = Translations.getModule("items", language);
		if (this.id === 0) {
			return this.getName(language);
		}
		return tr.format(
			`${this.categoryName}.fieldValue`, {
				name: this.getName(language),
				rarity: this.getRarityTranslation(language),
				values: this.getValues(language)
			});
	}

	public getSpeed(): number {
		let before = 0;
		if (this.rawSpeed > 0) {
			before = 1.15053 * Math.pow(this.multiplier(), 2.3617) * Math.pow(1.0569 + 0.1448 / this.multiplier(), this.rawSpeed);
		}
		return Math.round(before * 0.5) + this.speed;
	}

	/**
	 * Get the multiplier for the item depending on its rarity
	 * @protected
	 */
	protected multiplier(): number {
		return InventoryConstants.ITEMS_MAPPER[this.rarity];
	}

	/**
	 * Get the string for the stats of the main item
	 * @param language
	 * @param maxStatsValue
	 * @protected
	 */
	protected getValues(language: string, maxStatsValue: MaxStatsValues = null): string {
		if (!maxStatsValue) {
			maxStatsValue = {attack: Infinity, defense: Infinity, speed: Infinity};
		}
		const values: string[] = [];
		const tr = Translations.getModule("items", language);
		getStringValueFor(tr, values, {
			value: this.getAttack(),
			maxValue: maxStatsValue.attack,
			typeValue: "attack"
		});
		getStringValueFor(tr, values, {
			value: this.getDefense(),
			maxValue: maxStatsValue.defense,
			typeValue: "defense"
		});
		getStringValueFor(tr, values, {
			value: this.getSpeed(),
			maxValue: maxStatsValue.speed,
			typeValue: "speed"
		});
		return values.join(" ");
	}
}

export const MainItemModelAttributes = {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	rarity: {
		type: DataTypes.INTEGER,
		defaultValue: 0
	},
	rawAttack: {
		type: DataTypes.INTEGER,
		defaultValue: 0
	},
	rawDefense: {
		type: DataTypes.INTEGER,
		defaultValue: 0
	},
	rawSpeed: {
		type: DataTypes.INTEGER,
		defaultValue: 0
	},
	attack: {
		type: DataTypes.INTEGER,
		defaultValue: 0
	},
	defense: {
		type: DataTypes.INTEGER,
		defaultValue: 0
	},
	speed: {
		type: DataTypes.INTEGER,
		defaultValue: 0
	},
	fr: {
		type: DataTypes.TEXT
	},
	en: {
		type: DataTypes.TEXT
	},
	emote: {
		type: DataTypes.TEXT
	},
	fallbackEmote: {
		type: DataTypes.TEXT
	},
	updatedAt: {
		type: DataTypes.DATE,
		defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
	},
	createdAt: {
		type: DataTypes.DATE,
		defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
	},
	frenchMasculine: {
		type: DataTypes.BOOLEAN
	},
	frenchPlural: {
		type: DataTypes.BOOLEAN
	}
};