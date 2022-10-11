import {DataTypes, Model, Sequelize} from "sequelize";
import PetEntity from "./PetEntity";
import moment = require("moment");
import Guild from "./Guild";
import {draftBotInstance} from "../../../bot";

export class GuildPet extends Model {
	public readonly id!: number;

	public guildId!: number;

	public petEntityId!: number;

	public updatedAt!: Date;

	public createdAt!: Date;
}

/**
 * this class is used to information about pets that are in a shelter
 */
export class GuildPets {

	/**
	 * add pet to a shelter
	 * @param guild
	 * @param petEntity
	 * @param logInDatabase
	 */
	static addPet(guild: Guild, petEntity: PetEntity, logInDatabase: boolean): GuildPet {
		if (logInDatabase) {
			draftBotInstance.logsDatabase.logGuildNewPet(guild, petEntity).then();
		}
		return GuildPet.build({guildId: guild.id, petEntityId: petEntity.id});
	}

	/**
	 * get the list of pets that are in the shelter of a guild
	 * @param guildId
	 */
	static async getOfGuild(guildId: number): Promise<GuildPet[]> {
		return await GuildPet.findAll({
			where: {
				guildId
			}
		});
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
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
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