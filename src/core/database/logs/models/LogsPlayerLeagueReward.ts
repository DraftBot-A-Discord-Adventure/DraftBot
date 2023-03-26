import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayerLeagueReward extends Model {
	public readonly playerId!: number;

	public readonly leagueLastSeason!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayerLeagueReward.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		leagueLastSeason: {
			type: DataTypes.TINYINT,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "league_rewards",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}