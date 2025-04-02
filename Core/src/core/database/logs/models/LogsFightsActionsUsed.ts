import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsFightsActionsUsed extends Model {
	declare readonly fightId: number;

	declare readonly player: number;

	declare readonly actionId: number;

	declare readonly count: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsFightsActionsUsed.init({
		fightId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		player: {
			type: DataTypes.TINYINT,
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
		tableName: "fights_actions_used",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
