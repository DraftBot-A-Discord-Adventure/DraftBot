import {DataTypes, Model, Sequelize} from "sequelize";
import * as moment from "moment";
import {Constants} from "../../../Constants";

export class Monster extends Model {
	public readonly id!: string;

	public readonly fr!: string;

	public readonly en!: string;

	public readonly baseFightPoints!: number;

	public readonly baseAttack!: number;

	public readonly baseDefense!: number;

	public readonly baseSpeed!: number;

	public readonly rewardMultiplier!: number;

	public updatedAt!: Date;

	public createdAt!: Date;


	public getName(language: string): string {
		return language === Constants.LANGUAGE.FRENCH ? this.fr : this.en;
	}
}

export function initModel(sequelize: Sequelize): void {
	Monster.init({
		id: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			primaryKey: true
		},
		fr: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			allowNull: false
		},
		en: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			allowNull: false
		},
		baseFightPoints: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		baseAttack: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		baseDefense: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		baseSpeed: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		rewardMultiplier: {
			type: DataTypes.FLOAT,
			allowNull: false
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
		tableName: "monsters",
		freezeTableName: true
	});

	Monster.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Monster;