import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPetEntities extends Model {
	declare readonly id: number;

	declare readonly gameId: number;

	declare readonly creationTimestamp: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPetEntities.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		gameId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		},
		creationTimestamp: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "pet_entities",
		freezeTableName: true,
		timestamps: false
	});
}
