import {QueryTypes, Sequelize} from "sequelize";
import {Constants} from "../../../Constants";
import {SupportItemModel, SupportItemModelAttributes} from "./SupportItemModel";
import {format} from "../../../utils/StringFormatter";
import {Translations} from "../../../Translations";
import {minutesDisplay} from "../../../utils/TimeUtils";
import {MaxStatsValues} from "./GenericItemModel";
import fs = require("fs");
import moment = require("moment");

export class ObjectItem extends SupportItemModel {
	categoryName = "objects";

	public getCategory(): number {
		return Constants.ITEM_CATEGORIES.OBJECT;
	}

	getNatureTranslation(language: string, maxStatsValue: MaxStatsValues = null): string {
		if (maxStatsValue === null) {
			maxStatsValue = {attack: Infinity, defense: Infinity, speed: Infinity};
		}
		const tr = Translations.getModule("items", language);
		if (this.nature === Constants.ITEM_NATURE.TIME_SPEEDUP) {
			return format(
				tr.getFromArray("objects.natures", this.nature),
				{
					power: minutesDisplay(this.power, language)
				});
		}
		if (this.nature === Constants.ITEM_NATURE.SPEED) {
			const speedDisplay = maxStatsValue.speed >= this.power / 2 ? this.power : format(tr.get("nerfDisplay"),
				{
					old: this.power,
					max: maxStatsValue.speed * 2
				});
			return format(
				tr.getFromArray("objects.natures", this.nature),
				{power: speedDisplay});
		}
		return format(
			tr.getFromArray("objects.natures", this.nature),
			{power: this.power});
	}

	public getItemAddedValue(): number {
		return this.power;
	}
}

export class ObjectItems {
	static getMaxId(): Promise<number> {
		return new Promise((resolve, reject) => {
			fs.readdir("resources/text/objects/", (err, files) => {
				err ? reject(err) : resolve(files.length - 1);
			}
			);
		});
	}

	static getById(id: number): Promise<ObjectItem | null> {
		return Promise.resolve(ObjectItem.findOne({
			where: {
				id
			}
		}));
	}

	static getAllIdsForRarity(rarity: number): Promise<{ id: number }[]> {
		const query = `SELECT id
                       FROM draftbot_game.objects
                       WHERE rarity = :rarity`;
		return Promise.resolve(ObjectItem.sequelize.query(query, {
			replacements: {
				rarity: rarity
			},
			type: QueryTypes.SELECT
		}));
	}

	static randomItem(nature: number, rarity: number): Promise<ObjectItem> {
		return Promise.resolve(ObjectItem.findOne({
			where: {
				nature,
				rarity
			},
			order: ObjectItem.sequelize.random()
		}));
	}
}

export function initModel(sequelize: Sequelize): void {
	ObjectItem.init(SupportItemModelAttributes, {
		sequelize,
		tableName: "objects",
		freezeTableName: true
	});

	ObjectItem.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default ObjectItem;