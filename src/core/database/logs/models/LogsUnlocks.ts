import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsUnlocks extends Model {
	public readonly buyerId!: number;

	public readonly releasedId!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsUnlocks.init({
		buyerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		releasedId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "unlocks",
		freezeTableName: true,
		timestamps: false
	});

	LogsUnlocks.removeAttribute("id");
}