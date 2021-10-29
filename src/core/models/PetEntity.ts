import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import Pet from "./Pet";
import moment = require("moment");

export class PetEntity extends Model {
	public updatedAt!: Date;

	public createdAt!: Date;


	public PetModel: Pet;
}

export class PetEntities {

}

export function initModel(sequelize: Sequelize) {
	PetEntity.init({
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
		tableName: "pet_entities",
		freezeTableName: true
	});

	PetEntity.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default PetEntity;