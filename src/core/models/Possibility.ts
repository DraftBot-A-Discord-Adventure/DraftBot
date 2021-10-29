import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import moment = require("moment");

export class Possibility extends Model {
	public possibilityKey!: string;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export class Possibilities {

}

export function initModel(sequelize: Sequelize) {
	Possibility.init({
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "possibilities",
		freezeTableName: true
	});

	Possibility.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Possibility;