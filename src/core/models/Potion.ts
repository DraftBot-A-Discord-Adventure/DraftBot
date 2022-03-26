import {
	Sequelize,
	QueryTypes
} from "sequelize";
import fs = require("fs");
import {Constants} from "../Constants";
import {SupportItemModel, SupportItemModelAttributes} from "./SupportItemModel";
import {Translations} from "../Translations";
import {format} from "../utils/StringFormatter";
import ObjectItem from "./ObjectItem";
import moment = require("moment");

export class Potion extends SupportItemModel {
	categoryName = "potions";

	public getCategory(): number {
		return Constants.ITEM_CATEGORIES.POTION;
	}

	getNatureTranslation(language: string): string {
		return format(
			Translations.getModule("items", language).getFromArray("potions.natures", this.nature),
			{
				power: this.power
			});
	}

	public getSimplePotionName(language: string): string {
		return this.getName(language).slice(this.getName(language).indexOf(" ") + 1)
			.replace(/\*\*/g, "");
	}

	public getEmoji(): string {
		return this.fr.split(" ")[0];
	}

	public isFightPotion(): boolean {
		return this.getSpeed() !== 0 || this.getAttack() !== 0 ||
			this.getDefense() !== 0;
	}

	public getItemAddedValue(): number {
		return this.power;
	}
}

export class Potions {
	static getMaxId(): Promise<number> {
		return new Promise((resolve, reject) => {
			fs.readdir("resources/text/potions/", (err, files) => {
				err ? reject(err) : resolve(files.length - 1);
			}
			);
		});
	}

	static getById(id: number): Promise<Potion | null> {
		return Promise.resolve(Potion.findOne({
			where: {
				id
			}
		}));
	}

	static getAllIdsForRarity(rarity: number): Promise<{ id: number }[]> {
		const query = `SELECT id
		               FROM potions
		               WHERE rarity = :rarity`;
		return Promise.resolve(Potion.sequelize.query(query, {
			replacements: {
				rarity: rarity
			},
			type: QueryTypes.SELECT
		}));
	}

	static randomItem(nature: number, rarity: number): Promise<Potion> {
		return Promise.resolve(Potion.findOne({
			where: {
				nature,
				rarity
			},
			order: ObjectItem.sequelize.random()
		}));
	}
}

export function initModel(sequelize: Sequelize) {
	Potion.init(SupportItemModelAttributes, {
		sequelize,
		tableName: "potions",
		freezeTableName: true
	});

	Potion.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Potion;