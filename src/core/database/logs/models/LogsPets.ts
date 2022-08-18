import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPets extends Model {
	public readonly id!: number;

	public readonly inGameId!: number;

	public readonly petId!: number;

	public readonly isDeleted: boolean;
}

export function initModel(sequelize: Sequelize): void {
	LogsPets.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		inGameId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		petId: {
			type: DataTypes.SMALLINT,
			allowNull: false
		},
		sex: {
			type: DataTypes.STRING,
			allowNull: false
		},
		isDeleted: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "pets",
		freezeTableName: true,
		timestamps: false
	});
}