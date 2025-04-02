import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsCommandSubOrigins extends Model {
	declare readonly id: number;

	declare readonly name: string;
}

export function initModel(sequelize: Sequelize): void {
	LogsCommandSubOrigins.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.TEXT,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "command_sub_origins",
		freezeTableName: true,
		timestamps: false
	});
}
