import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPetEntities extends Model {
	public readonly id!: number;

	public readonly gameId!: number;

	public readonly petId!: number;

	public readonly isFemale!: boolean;

	public readonly isDeleted!: boolean;
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
		petId: {
			type: DataTypes.SMALLINT.UNSIGNED,
			allowNull: false
		},
		isFemale: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		isDeleted: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "pet_entities",
		freezeTableName: true,
		timestamps: false
	});
}