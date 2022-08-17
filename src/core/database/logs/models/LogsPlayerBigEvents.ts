import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayerBigEvents extends Model {
	public readonly playerId!: number;

	public readonly bigEventId!: number;

	public readonly date!: Date;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayerBigEvents.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		bigEventId: {
			type: DataTypes.SMALLINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_big_events",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayerBigEvents.removeAttribute("id");
}