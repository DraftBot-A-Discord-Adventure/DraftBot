import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPossibilities extends Model {
	declare readonly id: number;

	declare readonly bigEventId: number;

	declare readonly possibilityName: string;

	declare readonly issueIndex: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPossibilities.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		bigEventId: {
			type: DataTypes.SMALLINT.UNSIGNED,
			allowNull: false
		},
		possibilityName: {
			type: DataTypes.STRING(256), // eslint-disable-line new-cap
			allowNull: true // Null for end
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
