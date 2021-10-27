import {DataTypes} from "sequelize";
import {Data} from "../Data";
import {Translations} from "../Translations";
import {GenericItemModel} from "./GenericItemModel";
import {EmbedField} from "discord.js";

export abstract class MainItemModel extends GenericItemModel {

	public readonly rawAttack!: number;

	public readonly rawDefense!: number;

	public readonly rawSpeed!: number;

	public readonly attack!: number;

	public readonly defense!: number;

	public readonly speed!: number;


	protected toFieldObject(language: string, maxStatsValue: number): EmbedField {
		const tr = Translations.getModule("items", language);
		const name = this.getName(language);
		return {
			name: tr.get(this.categoryName + ".fieldName"),
			value: this.id === 0 ? name : tr.format(this.categoryName + ".fieldName", {
				name,
				rarity: this.getRarityTranslation(language),
				values: this.getValues(language, maxStatsValue)
			}),
			inline: false
		};
	}

	public toString(language: string) {
		const tr = Translations.getModule("items", language);
		return this.id === 0 ? language === "fr" ? this.fr : this.en : tr.format(
			this.categoryName + ".fieldValue", {
				name: this.getName(language),
				rarity: this.getRarityTranslation(language),
				values: this.getValues(language)
			});
	}

	protected multiplier(): number {
		return Data.getModule("items").getNumberFromArray("mapper", this.rarity);
	}

	protected getValues(language: string, maxStatsValue: number | null = null): string {
		const values = [];
		const tr = Translations.getModule("items", language);

		if (this.getAttack() !== 0) {
			values.push(tr.format("attack", {
				attack: this.getAttack()
			}));
		}

		if (this.getDefense() !== 0) {
			if (isNaN(maxStatsValue) || !maxStatsValue) {
				maxStatsValue = Infinity;
			}
			const defenseDisplay = maxStatsValue > this.getDefense() ? this.getDefense() : tr.format("nerfDisplay",
				{
					old: this.getDefense(),
					max: maxStatsValue
				});
			values.push(tr.format("defense", {
				defense: defenseDisplay
			}));
		}

		if (this.getSpeed() !== 0) {
			values.push(tr.format("speed", {
				speed: this.getSpeed()
			}));
		}

		return values.join(" ");
	}

	public getSpeed(): number {
		let before = 0;
		if (this.rawSpeed > 0) {
			before = 1.15053 * Math.pow(this.multiplier(), 2.3617) * Math.pow(1.0569 + 0.1448 / this.multiplier(), this.rawSpeed);
		}
		return Math.round(before * 0.5) + this.speed;
	}
}

export const MainItemModelAttributes = {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	rarity: {
		type: DataTypes.INTEGER
	},
	rawAttack: {
		type: DataTypes.INTEGER
	},
	rawDefense: {
		type: DataTypes.INTEGER
	},
	rawSpeed: {
		type: DataTypes.INTEGER
	},
	attack: {
		type: DataTypes.INTEGER
	},
	defense: {
		type: DataTypes.INTEGER
	},
	speed: {
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
		defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
	},
	createdAt: {
		type: DataTypes.DATE,
		defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
	},
	frenchMasculine: {
		type: DataTypes.INTEGER
	},
	frenchPlural: {
		type: DataTypes.INTEGER
	}
};