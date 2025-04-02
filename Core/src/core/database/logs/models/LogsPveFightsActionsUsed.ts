import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPveFightsActionsUsed extends Model {
	declare readonly pveFightId: number;

	declare readonly actionId: number;

	declare readonly count: number;
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
