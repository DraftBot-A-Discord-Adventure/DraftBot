import {DataTypes, Model, Sequelize} from "sequelize";
import {readdir} from "fs";
import * as moment from "moment";
import {PetEntityConstants} from "../../../constants/PetEntityConstants";

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
		return PetEntityConstants.EMOTE.RARITY.repeat(this.rarity);
	}
}

export class Pets {
	static getById(id: number): Promise<Pet> {
		return Pet.findOne({
			where: {
				id: id
			}
		});
	}

	static getMaxId(): Promise<number> {
		return new Promise((resolve, reject) => {
			readdir("resources/text/pets/", (err, files) => {
				err ? reject(err) : resolve(files.length - 1);
			}
			);
		});
	}
}

export function initModel(sequelize: Sequelize): void {
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
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
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