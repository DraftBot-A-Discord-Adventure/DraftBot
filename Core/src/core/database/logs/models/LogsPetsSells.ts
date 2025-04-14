import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPetsSells extends Model {
	declare readonly petId: number;

	declare readonly sellerId: number;

	declare readonly buyerId: number;

	declare readonly price: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPetsSells.init({
		petId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		sellerId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		buyerId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		price: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "pet_sells",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
