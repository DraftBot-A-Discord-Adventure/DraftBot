import {GenericItemModel} from "./GenericItemModel";
import {Translations} from "../Translations";
import {DataTypes} from "sequelize";
import {Constants} from "../Constants";

export abstract class SupportItemModel extends GenericItemModel {
	public readonly power!: number;

	public readonly nature!: number;


	protected toFieldObject(language: string, maxStatsValue: number) {
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

	public toString(language: string, maxStatsValue: number): string {
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

	public abstract getNatureTranslation(language: string, maxStatsValue: number): string;
}

export const SupportItemModelAttributes = {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	rarity: {
		type: DataTypes.INTEGER
	},
	power: {
		type: DataTypes.INTEGER
	},
	nature: {
		type: DataTypes.INTEGER
	},
	fr: {
		type: DataTypes.TEXT
	},
	en: {
		type: DataTypes.TEXT
	},
	updatedAt: {
		type: DataTypes.DATE,
		defaultValue: require("moment")()
			.format("YYYY-MM-DD HH:mm:ss")
	},
	createdAt: {
		type: DataTypes.DATE,
		defaultValue: require("moment")()
			.format("YYYY-MM-DD HH:mm:ss")
	},
	frenchMasculine: {
		type: DataTypes.INTEGER
	},
	frenchPlural: {
		type: DataTypes.INTEGER
	}
};