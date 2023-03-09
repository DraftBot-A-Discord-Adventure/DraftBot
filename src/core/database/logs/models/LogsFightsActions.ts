import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsFightsActions extends Model {
	public readonly id!: number;

	public readonly name!: string;

	public readonly classId!: number;
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