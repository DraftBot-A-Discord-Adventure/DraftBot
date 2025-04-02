import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsFightsActions extends Model {
	declare readonly id: number;

	declare readonly name: string;

	declare readonly classId: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsFightsActions.init({
		id: {
			type: DataTypes.SMALLINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		classId: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: true
		}
	}, {
		sequelize,
		tableName: "fights_actions",
		freezeTableName: true,
		timestamps: false
	});
}
