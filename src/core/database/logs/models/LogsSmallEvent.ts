import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsSmallEvent extends Model {
	public readonly id!: number;

	public readonly name!: string;
}

export function initModel(sequelize: Sequelize): void {
	LogsSmallEvent.init({
		id: {
			type: DataTypes.TINYINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "small_events",
		freezeTableName: true,
		timestamps: false
	});
}