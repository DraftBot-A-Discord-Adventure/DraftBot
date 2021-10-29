import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import moment = require("moment");

export class Pet extends Model {
	public updatedAt!: Date;

	public createdAt!: Date;
}

export class Pets {

}

export function initModel(sequelize: Sequelize) {
	Pet.init({
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
		tableName: "pets",
		freezeTableName: true
	});

	Pet.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Pet;