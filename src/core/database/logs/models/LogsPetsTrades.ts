import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPetsTrades extends Model {
	public readonly firstPetId!: number;

	public readonly secondPetId!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPetsTrades.init({
		firstPetId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		secondPetId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "pets_trades",
		freezeTableName: true,
		timestamps: false
	});

	LogsPetsTrades.removeAttribute("id");
}