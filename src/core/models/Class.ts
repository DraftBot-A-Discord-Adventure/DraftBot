import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import {Translations} from "../Translations";
import moment = require("moment");

export class Class extends Model {
	public readonly id!: number;

	public readonly attack!: number;

	public readonly defense!: number;

	public readonly speed!: number;

	public readonly health!: number;

	public readonly fightPoint!: number;

	public readonly emoji!: string;

	public readonly classgroup!: number;

	public readonly price!: number;

	public readonly fr!: string;

	public readonly en!: string;

	public updatedAt!: Date;

	public createdAt!: Date;

	public toString(language: string, level: number): string {
		const tr = Translations.getModule("classesValues", language);
		return tr.format("fieldsValue", {
			name: this.getName(language),
			attack: this.getAttackValue(level),
			defense: this.getDefenseValue(level),
			speed: this.getSpeedValue(level),
			health: this.health + level,
			price: this.price,
			classgroup: this.classgroup,
			fightPoint: this.getMaxCumulativeHealthValue(level)
		});
	}

	public getName(language: string): string {
		return language === "fr" ? this.fr : this.en;
	}

	public getDescription(language: string): string {
		return Translations.getModule("commands.class", language).get("description." + this.id);
	}

	public getAttackValue(level: number): number {
		return Math.round(this.attack + this.attack / 100 * level / 4 * level / 10);
	}

	public getDefenseValue(level: number): number {
		return Math.round(this.defense + this.defense / 100 * level / 4 * level / 10);
	}

	public getSpeedValue(level: number): number {
		return Math.round(this.speed + this.speed / 100 * level / 4 * level / 10);
	}

	public getMaxCumulativeHealthValue(level: number): number {
		return Math.round(this.fightPoint + 10 * level + level / 4 * level / 8);
	}

	public getMaxHealthValue(level: number): number {
		return this.health + level;
	}
}

export class Classes {
	static getById(id: number): Promise<Class | null> {
		return Promise.resolve(Class.findOne({
			where: {
				id
			}
		}));
	}

	static getByGroupId(groupId: number): Promise<Class[]> {
		return Promise.resolve(Class.findAll({
			where: {
				classgroup: groupId
			}
		}));
	}

	static getByEmoji(emoji: string): Promise<Class | null> {
		return Promise.resolve(Class.findOne({
			where: {
				emoji
			}
		}));
	}
}

export function initModel(sequelize: Sequelize) {
	Class.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
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
		health: {
			type: DataTypes.INTEGER
		},
		fightPoint: {
			type: DataTypes.INTEGER
		},
		emoji: {
			type: DataTypes.TEXT
		},
		classgroup: {
			type: DataTypes.INTEGER
		},
		price: {
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
		}
	},
	{
		sequelize,
		tableName: "classes",
		freezeTableName: true
	});

	Class.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Class;