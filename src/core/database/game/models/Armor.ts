import {QueryTypes, Sequelize} from "sequelize";
import {Constants} from "../../../Constants";
import {MainItemModel, MainItemModelAttributes} from "./MainItemModel";
import fs = require("fs");
import moment = require("moment");
import {botConfig} from "../../../bot";

export class Armor extends MainItemModel {
	categoryName = "armors";

	public getAttack(): number {
		let before = 0;
		if (this.rawAttack > 0) {
			before = 1.15053 * Math.pow(this.multiplier(), 2.3617) * Math.pow(1.0569 + 0.1448 / this.multiplier(), this.rawAttack);
		}
		return Math.round(before * 0.75) + this.attack;
	}

	public getCategory(): number {
		return Constants.ITEM_CATEGORIES.ARMOR;
	}

	public getDefense(): number {
		return Math.round(1.15053 * Math.pow(this.multiplier(), 2.3617) * Math.pow(1.0569 + 0.1448 / this.multiplier(), this.rawDefense)) + this.defense;
	}

	public getItemAddedValue(): number {
		return this.rawDefense;
	}
}

export class Armors {
	static getMaxId(): Promise<number> {
		return new Promise((resolve, reject) => {
			fs.readdir("resources/text/armors/",
				(err, files) => {
					err ? reject(err) : resolve(files.length - 1);
				}
			);
		});
	}

	static getById(id: number): Promise<Armor | null> {
		return Promise.resolve(Armor.findOne({
			where: {
				id
			}
		}));
	}

	static getAllIdsForRarity(rarity: number): Promise<{ id: number }[]> {
		const query = `SELECT id
					   FROM ${botConfig.MARIADB_PREFIX} _game.armors
                       WHERE rarity = :rarity`;
		return Promise.resolve(Armor.sequelize.query(query, {
			replacements: {
				rarity: rarity
			},
			type: QueryTypes.SELECT
		}));
	}
}

export function initModel(sequelize: Sequelize): void {
	Armor.init(MainItemModelAttributes, {
		sequelize,
		tableName: "armors",
		freezeTableName: true
	});

	Armor.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Armor;