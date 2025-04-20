import {
	DataTypes,
	Model,
	Sequelize
} from "sequelize";

export class LogsPlayersTeleportations extends Model {
	declare readonly playerId: number;

	declare readonly originMapLinkId: number;

	declare readonly newMapLinkId: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersTeleportations.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		originMapLinkId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		newMapLinkId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_teleportations",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersTeleportations.removeAttribute("id");
}
