import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayerLeagueReward extends Model {
	public readonly playerId!: number;

	public readonly leagueLastSeason!: number;

	public readonly date!: Date;
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
			type: DataTypes.DATE,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "league_rewards",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}