import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayersTravels extends Model {
	public readonly playerId!: number;

	public readonly mapLinkId!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersTravels.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		mapLinkId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_travels",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersTravels.removeAttribute("id");
}