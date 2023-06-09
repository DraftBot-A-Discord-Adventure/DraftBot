import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPveFightsActionsUsed extends Model {
	public readonly pveFightId!: number;

	public readonly actionId!: number;

	public readonly count!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPveFightsActionsUsed.init({
		pveFightId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		actionId: {
			type: DataTypes.SMALLINT.UNSIGNED,
			allowNull: false
		},
		count: {
			type: DataTypes.TINYINT,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "pve_fights_actions_used",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}