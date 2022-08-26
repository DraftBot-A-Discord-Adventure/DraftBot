import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPetEntities extends Model {
	public readonly id!: number;

	public readonly gameId!: number;

	public readonly creationTimestamp!: number;
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