import {DataTypes, Model, Sequelize} from "sequelize";
import PetEntity from "./PetEntity";
import moment = require("moment");

export class GuildPet extends Model {
	public readonly id!: number;

	public guildId!: number;

	public petEntityId!: number;

	public updatedAt!: Date;

	public createdAt!: Date;

	public PetEntity: PetEntity;
}

export class GuildPets {
	static addPet(guildId: number, petEntityId: number): GuildPet {
		return GuildPet.build({guildId: guildId, petEntityId: petEntityId});
	}
}

export function initModel(sequelize: Sequelize): void {
	GuildPet.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		guildId: {
			type: DataTypes.INTEGER
		},
		petEntityId: {
			type: DataTypes.INTEGER
		},
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
		tableName: "guild_pets",
		freezeTableName: true
	});

	GuildPet.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default GuildPet;