import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsFightsActions extends Model {
	public readonly id!: number;

	public readonly name!: string;
}

export function initModel(sequelize: Sequelize): void {
	LogsFightsActions.init({
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
		tableName: "fights_actions",
		freezeTableName: true,
		timestamps: false
	});
}