import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsGuildsNewPets extends Model {
	public readonly guildId!: number;

	public readonly petId!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuildsNewPets.init({
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		petId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds_new_pets",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}