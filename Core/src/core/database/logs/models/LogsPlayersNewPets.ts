import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPlayersNewPets extends Model {
	declare readonly playerId: number;

	declare readonly petId: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersNewPets.init({
		playerId: {
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
		tableName: "players_new_pets",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
