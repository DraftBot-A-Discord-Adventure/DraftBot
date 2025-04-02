import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsGuildsEldersAdds extends Model {
	declare readonly guildId: number;

	declare readonly addedElder: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuildsEldersAdds.init({
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		addedElder: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds_elders_adds",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
