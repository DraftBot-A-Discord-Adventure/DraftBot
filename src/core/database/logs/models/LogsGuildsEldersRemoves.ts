import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsGuildsEldersRemoves extends Model {
	public readonly guildId!: number;

	public readonly removedElder!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuildsEldersRemoves.init({
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		removedElder: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds_elders_removes",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}