import {EmbedField} from "discord.js";
import {Translations} from "../Translations";
import {Model} from "sequelize";

export abstract class GenericItemModel extends Model {
	public readonly id!: number;

	public readonly rarity!: number;

	public readonly fr!: string;

	public readonly en!: string;

	public readonly frenchMasculine!: boolean;

	public readonly frenchPlural!: boolean;

	public updatedAt!: Date;

	public createdAt!: Date;


	abstract categoryName: string;

	protected abstract toFieldObject(language: string, maxStatsValue: number): EmbedField;

	public abstract toString(language: string, maxStatsValue: number): string;

	public getRarityTranslation(language: string): string  {
		return Translations.getModule("items", language).getFromArray("rarities", this.rarity);
	}

	public getName(language: string): string {
		return language === "fr" ? this.fr : this.en;
	}

	public abstract getAttack(): number;

	public abstract getDefense(): number;

	public abstract getSpeed(): number;

	public abstract getCategory(): number;

	public abstract getItemAddedValue(): number;
}