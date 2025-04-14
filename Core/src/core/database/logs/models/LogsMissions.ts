import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsMissions extends Model {
	declare readonly id: number;

	declare readonly name: string;

	declare readonly variant: number;

	declare readonly objective: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsMissions.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		variant: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		objective: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "missions",
		freezeTableName: true,
		timestamps: false
	});
}
