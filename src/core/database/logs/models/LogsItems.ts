import {DataTypes, Model} from "sequelize";

export abstract class LogsItem extends Model {
	public readonly playerId!: number;

	public readonly itemId!: number;

	public readonly name!: string;
}

export const logsItemAttributes = {
	playerId: DataTypes.INTEGER,
	itemId: DataTypes.SMALLINT.UNSIGNED,
	date: {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: false
	}
};