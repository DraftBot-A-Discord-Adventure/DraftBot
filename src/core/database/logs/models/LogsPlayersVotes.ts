import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayersVotes extends Model {
	public readonly playerId!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersVotes.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_votes",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersVotes.removeAttribute("id");
}