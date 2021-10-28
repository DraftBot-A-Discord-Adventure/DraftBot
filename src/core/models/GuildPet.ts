import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";

export class GuildPet extends Model {
	public id!: number;

	public guildId!: number;

	public petEntityId!: number;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export class GuildPets {
	static addPet(guildId: number, petEntityId: number): void {
		GuildPet.build({guildId: guildId, petEntityId: petEntityId});
	}
}

export function initModel(sequelize: Sequelize) {
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
		instance.updatedAt = require("moment")().format("YYYY-MM-DD HH:mm:ss");
	});
}

export default GuildPet;