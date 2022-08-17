import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsAlteration extends Model {
	public readonly id!: number;

	public readonly alteration!: string;
}

export function initModel(sequelize: Sequelize): void {
	LogsAlteration.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		alteration: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "alteration",
		freezeTableName: true,
		timestamps: false
	});
}