import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPetsTransfers extends Model {
	public readonly playerPetId: number;

	public readonly guildPetId: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPetsTransfers.init({
		playerPetId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		guildPetId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "pets_transfers",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}