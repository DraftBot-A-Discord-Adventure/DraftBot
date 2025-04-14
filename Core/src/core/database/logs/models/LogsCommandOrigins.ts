import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsCommandOrigins extends Model {
	declare readonly id: number;

	declare readonly name: string;
}

export function initModel(sequelize: Sequelize): void {
	LogsCommandOrigins.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "command_origins",
		freezeTableName: true,
		timestamps: false
	});
}
