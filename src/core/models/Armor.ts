import {
	Sequelize,
	Model,
	DataTypes, QueryTypes
} from "sequelize";
import fs = require("fs");
import {EmbedField} from "discord.js";
import {Translations} from "../Translations";
import {Data} from "../Data";
import {Constants} from "../Constants";

export class Armor extends Model {
	public readonly id!: number;

	public readonly rarity!: number;

	public readonly rawAttack!: number;

	public readonly rawDefense!: number;

	public readonly rawSpeed!: number;

	public readonly attack!: number;

	public readonly defense!: number;

	public readonly speed!: number;

	public readonly fr!: string;

	public readonly en!: string;

	public readonly frenchMasculine!: boolean;

	public readonly frenchPlural!: boolean;

	public updatedAt!: Date;

	public createdAt!: Date;

	public toFieldObject(language: string, maxStatsValue: number): EmbedField {
		const tr = Translations.getModule("items", language);
		const name = this.getName(language);
		return {
			name: tr.get("armors.fieldName"),
			value: this.id === 0 ? name : tr.format("armors.fieldName", {
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
			"weapons.fieldValue", {
				name: this.getName(language),
				rarity: this.getRarityTranslation(language),
				values: this.getValues(language)
			});
	}

	public getRarityTranslation(language: string) {
		return Translations.getModule("items", language).getFromArray("rarities", this.rarity);
	}

	multiplier(): number {
		return Data.getModule("items").getNumberFromArray("mapper", this.rarity);
	}

	getAttack(): number {
		let before = 0;
		if (this.rawAttack > 0) {
			before = 1.15053 * Math.pow(this.multiplier(), 2.3617) * Math.pow(1.0569 + 0.1448 / this.multiplier(), this.rawAttack);
		}
		return Math.round(before * 0.75) + this.attack;
	}

	getName(language: string): string {
		return language === "fr" ? this.fr : this.en;
	}

	getDefense(): number {
		return Math.round(1.15053 * Math.pow(this.multiplier(), 2.3617) * Math.pow(1.0569 + 0.1448 / this.multiplier(), this.rawDefense)) + this.defense;
	}

	getSpeed(): number {
		let before = 0;
		if (this.rawSpeed > 0) {
			before = 1.15053 * Math.pow(this.multiplier(), 2.3617) * Math.pow(1.0569 + 0.1448 / this.multiplier(), this.rawSpeed);
		}
		return Math.round(before * 0.5) + this.speed;
	}

	getValues(language: string, maxStatsValue: number | null = null): string {
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

	getCategory(): number {
		return Constants.ITEM_CATEGORIES.ARMOR;
	}
}

export class Armors {
	static getMaxId(): Promise<number> {
		return new Promise((resolve, reject) => {
			fs.readdir("resources/text/armors/", (err, files) =>
				err ? reject(err) : resolve(files.length - 1)
			);
		});
	}

	static getById(id: number): Promise<Armor | null> {
		return Promise.resolve(Armor.findOne({
			where: {id}
		}));
	}

	static getAllIdsForRarity(rarity: number): Promise<{ id: number }[]> {
		const query = `SELECT id
	               FROM armors
	               WHERE rarity = :rarity`;
		return Promise.resolve(Armor.sequelize.query(query, {
			replacements: {
				rarity: rarity
			},
			type: QueryTypes.SELECT
		}));
	}
}

export function initModel(sequelize: Sequelize) {
	Armor.init({
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
	}, {
		sequelize,
		tableName: "armors",
		freezeTableName: true
	});

	Armor.beforeSave(instance => {
		instance.updatedAt = require("moment")().format("YYYY-MM-DD HH:mm:ss");
	});
}

export default Armor;