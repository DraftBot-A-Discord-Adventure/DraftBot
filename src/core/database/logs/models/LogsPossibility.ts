import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPossibility extends Model {
	public readonly id!: number;

	public readonly bigEventId!: number;

	public readonly emote!: string;

	public readonly issueIndex!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPossibility.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		bigEventId: {
			type: DataTypes.SMALLINT.UNSIGNED,
			allowNull: false
		},
		emote: {
			type: DataTypes.STRING(1), // eslint-disable-line new-cap
			allowNull: true // null for end
		},
		issueIndex: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "possibilities",
		freezeTableName: true,
		timestamps: false
	});
}