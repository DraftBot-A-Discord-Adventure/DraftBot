import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import moment = require("moment");
import {Data} from "../Data";
import * as fs from "fs";

export class Pet extends Model {
	public readonly id!: number;

	public readonly rarity!: number;

	public readonly maleNameFr!: string;

	public readonly maleNameEn!: string;

	public readonly femaleNameFr!: string;

	public readonly femaleNameEn!: string;

	public readonly emoteMale!: string;

	public readonly emoteFemale!: string;

	public readonly diet: string;

	public updatedAt!: Date;

	public createdAt!: Date;


	public getRarityDisplay(): string {
		return Data.getModule("models.pets")
			.getString("rarityEmote")
			.repeat(this.rarity);
	}
}

export class Pets {
	static getById(id: number) {
		return Pet.findOne({
			where: {
				id: id
			}
		});
	}

	static getMaxId(): Promise<number> {
		return new Promise((resolve, reject) => {
			fs.readdir("resources/text/pets/", (err, files) => {
				err ? reject(err) : resolve(files.length - 1);
			}
			);
		});
	}
}

export function initModel(sequelize: Sequelize) {
	Pet.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		rarity: {
			type: DataTypes.INTEGER
		},
		maleNameFr: {
			type: DataTypes.TEXT
		},
		maleNameEn: {
			type: DataTypes.TEXT
		},
		femaleNameFr: {
			type: DataTypes.TEXT
		},
		femaleNameEn: {
			type: DataTypes.TEXT
		},
		emoteMale: {
			type: DataTypes.TEXT
		},
		emoteFemale: {
			type: DataTypes.TEXT
		},
		diet: {
			type: DataTypes.TEXT,
			defaultValue: null
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "pets",
		freezeTableName: true
	});

	Pet.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Pet;