import {DataTypes, Model, Sequelize} from "sequelize";
import * as moment from "moment";
import {FightConstants} from "../../../constants/FightConstants";

export class MonsterAttack extends Model {
	public readonly id!: number;

	public readonly monsterId!: number;

	public readonly attackId!: string;

	public readonly minLevel!: number;

	public readonly weight!: number;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export function initModel(sequelize: Sequelize): void {
	MonsterAttack.init({
		monsterId: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			allowNull: false
		},
		attackId: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			allowNull: false
		},
		minLevel: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		weight: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: FightConstants.DEFAULT_ACTION_WEIGHT
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
		tableName: "monster_attacks",
		freezeTableName: true
	}).removeAttribute("id");

	MonsterAttack.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default MonsterAttack;