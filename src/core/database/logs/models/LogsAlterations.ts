import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsAlterations extends Model {
	public readonly id!: number;

	public readonly alteration!: string;
}

export function initModel(sequelize: Sequelize): void {
	LogsAlterations.init({
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
		tableName: "alterations",
		freezeTableName: true,
		timestamps: false
	});
}