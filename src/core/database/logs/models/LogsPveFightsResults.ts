import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPveFightsResults extends Model {
	public readonly id!: number;

	public readonly playerId!: number;

	public readonly monsterId!: string;

	public readonly monsterLevel!: number;

	public readonly monsterFightPoints!: number;

	public readonly monsterAttack!: number;

	public readonly monsterDefense!: number;

	public readonly monsterSpeed!: number;

	public readonly turn!: number;

	public readonly winner!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPveFightsResults.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		monsterId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		monsterLevel: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		monsterFightPoints: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		monsterAttack: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		monsterDefense: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		monsterSpeed: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		turn: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		winner: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "pve_fights_results",
		freezeTableName: true,
		timestamps: false
	});
}