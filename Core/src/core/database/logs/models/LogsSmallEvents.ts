import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsSmallEvents extends Model {
	declare readonly id: number;

	declare readonly name: string;
}

export function initModel(sequelize: Sequelize): void {
	LogsSmallEvents.init({
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
