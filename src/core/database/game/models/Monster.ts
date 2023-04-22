import {DataTypes, Model, Sequelize} from "sequelize";
import * as moment from "moment";
import {Constants} from "../../../Constants";

export class Monster extends Model {
	public readonly id!: string;

	public readonly fr!: string;

	public readonly en!: string;

	public readonly fightPointsRatio!: number;

	public readonly attackRatio!: number;

	public readonly defenseRatio!: number;

	public readonly speedRatio!: number;

	public readonly breath!: number;

	public readonly maxBreath!: number;

	public readonly breathRegen!: number;

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
		fightPointsRatio: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		attackRatio: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		defenseRatio: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		speedRatio: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		breath: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		maxBreath: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		breathRegen: {
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