import {GenericItemModel} from "./GenericItemModel";
import {Translations} from "../../../Translations";
import {DataTypes} from "sequelize";
import {Constants} from "../../../Constants";
import moment = require("moment");

type FieldObject = { name: string, value: string, inline: boolean }
type MaxStatsValues = { attack: number, defense: number, speed: number }

export abstract class SupportItemModel extends GenericItemModel {
	public readonly power!: number;

	public readonly nature!: number;

	public toString(language: string, maxStatsValue: MaxStatsValues): string {
		const name = this.getName(language);
		return this.id === 0 ? name : Translations.getModule("items", language).format("potions.fieldValue", {
			name,
			rarity: this.getRarityTranslation(language),
			nature: this.getNatureTranslation(language, maxStatsValue)
		});
	}

	public getAttack(): number {
		return this.nature === Constants.ITEM_NATURE.ATTACK ? this.power : 0;
	}

	public getDefense(): number {
		return this.nature === Constants.ITEM_NATURE.DEFENSE ? this.power : 0;
	}

	public getSpeed(): number {
		return this.nature === Constants.ITEM_NATURE.SPEED ? this.power : 0;
	}

	public abstract getNatureTranslation(language: string, maxStatsValue: MaxStatsValues): string;

	public toFieldObject(language: string, maxStatsValue: MaxStatsValues): FieldObject {
		const tr = Translations.getModule("items", language);
		const name = this.getName(language);
		return {
			name: tr.get(this.categoryName + ".fieldName"),
			value: this.id === 0 ? name : tr.format("potions.fieldValue", {
				name,
				rarity: this.getRarityTranslation(language),
				nature: this.getNatureTranslation(language, maxStatsValue)
			}),
			inline: false
		};
	}
}

export const SupportItemModelAttributes = {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	rarity: {
		type: DataTypes.INTEGER,
		defaultValue: 0
	},
	power: {
		type: DataTypes.INTEGER,
		defaultValue: 0
	},
	nature: {
		type: DataTypes.INTEGER,
		defaultValue: 0
	},
	fr: {
		type: DataTypes.TEXT
	},
	en: {
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
		type: DataTypes.INTEGER
	},
	frenchPlural: {
		type: DataTypes.INTEGER
	}
};