import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsFightsActionsUsed extends Model {
	public readonly fightId!: number;

	public readonly player!: number;

	public readonly actionId!: number;

	public readonly count!: number;
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
			type: DataTypes.TINYINT,
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