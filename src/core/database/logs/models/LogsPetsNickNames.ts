import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPetsNickNames extends Model {
	public readonly petId!: number;

	public readonly name: string;

	public readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPetsNickNames.init({
		petId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		name: DataTypes.SMALLINT,
		date: {
			type: DataTypes.DATE,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "pet_nicknames",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}