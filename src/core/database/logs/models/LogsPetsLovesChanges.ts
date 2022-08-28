import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPetsLovesChanges extends Model {
	public readonly petId!: number;

	public readonly lovePoints!: number;

	public readonly reason!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPetsLovesChanges.init({
		petId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		lovePoints: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		reason: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "pets_loves_changes",
		freezeTableName: true,
		timestamps: false
	});

	LogsPetsLovesChanges.removeAttribute("id");
}