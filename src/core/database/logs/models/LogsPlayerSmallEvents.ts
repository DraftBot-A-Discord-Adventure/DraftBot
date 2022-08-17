import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayerSmallEvents extends Model {
	public readonly playerId!: number;

	public readonly smallEventId!: number;

	public readonly date!: Date;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayerSmallEvents.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		smallEventId: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_small_events",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayerSmallEvents.removeAttribute("id");
}