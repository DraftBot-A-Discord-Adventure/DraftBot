import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPetsNicknames extends Model {
	declare readonly petId: number;

	declare readonly name: string;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPetsNicknames.init({
		petId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		name: {
			type: DataTypes.STRING(16), // eslint-disable-line new-cap
			allowNull: true
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "pet_nicknames",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
