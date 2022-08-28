import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPetsSells extends Model {
	public readonly petId!: number;

	public readonly sellerId!: number;

	public readonly buyerId!: number;

	public readonly price: number;

	public readonly date: number;
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