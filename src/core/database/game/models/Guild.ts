import {DataTypes, Model, QueryTypes, Sequelize} from "sequelize";
import {Data} from "../../../Data";
import GuildPet from "./GuildPet";
import PetEntity from "./PetEntity";
import Pet from "./Pet";
import {DraftBotEmbed} from "../../../messages/DraftBotEmbed";
import {TextBasedChannel} from "discord.js";
import {Translations} from "../../../Translations";
import {MissionsController} from "../../../missions/MissionsController";
import {Entities} from "./Entity";
import {Constants} from "../../../Constants";
import {getFoodIndexOf} from "../../../utils/FoodUtils";
import Player from "./Player";
import moment = require("moment");

export class Guild extends Model {
	public readonly id!: number;

	public name!: string;

	public guildDescription!: string;

	public score!: number;

	public level!: number;

	public experience!: number;

	public commonFood!: number;

	public carnivorousFood!: number;

	public herbivorousFood!: number;

	public ultimateFood!: number;

	public lastDailyAt!: Date;

	public chiefId!: number;

	public elderId!: number;

	public updatedAt!: Date;

	public createdAt!: Date;


	public GuildPets: GuildPet[];


	/**
	 * update the lastDailyAt date
	 */
	public updateLastDailyAt(): void {
		this.lastDailyAt = new Date();
	}

	/**
	 * get the experience needed to level up
	 */
	public getExperienceNeededToLevelUp(): number {
		return (
			Math.round(
				Constants.XP.BASE_VALUE *
				Math.pow(Constants.XP.COEFFICIENT, this.level + 1)
			) - Constants.XP.MINUS
		);
	}

	/**
	 * completely destroy a guild from the database
	 */
	public async completelyDestroyAndDeleteFromTheDatabase() {
		const petsToDestroy: Promise<void>[] = [];
		const petsEntitiesToDestroy: Promise<void>[] = [];
		for (const pet of this.GuildPets) {
			petsToDestroy.push(pet.destroy());
			petsEntitiesToDestroy.push(pet.PetEntity.destroy());
		}
		await Promise.all([
			Player.update(
				{guildId: null},
				{
					where: {
						guildId: this.id
					}
				}
			),
			Guild.destroy({
				where: {
					id: this.id
				}
			}),
			petsToDestroy,
			petsEntitiesToDestroy
		]);

	}

	/**
	 * set the guild's experience
	 * @param experience
	 */
	public setExperience(experience: number): void {
		if (experience > 0) {
			this.experience = experience;
		}
		else {
			this.experience = 0;
		}
	}

	/**
	 * add experience to the guild
	 * @param experience the experience to add
	 * @param channel the channel where the display will be done
	 * @param language the language to use to display the message
	 */
	public async addExperience(experience: number, channel: TextBasedChannel, language: string) {
		if (this.isAtMaxLevel()) {
			return;
		}
		// We assume that you cannot go the level 98 to 100 with 1 xp addition
		if (this.level === Constants.GUILD.MAX_LEVEL - 1) {
			const xpNeededToLevelUp = this.getExperienceNeededToLevelUp();
			if (this.experience + experience > xpNeededToLevelUp) {
				experience = xpNeededToLevelUp - this.experience;
			}
		}
		this.experience += experience;
		this.setExperience(this.experience);
		while (this.needLevelUp()) {
			await this.levelUpIfNeeded(channel, language);
		}
	}

	/**
	 * check if the guild need to level up
	 */
	public needLevelUp(): boolean {
		return this.experience >= this.getExperienceNeededToLevelUp();
	}

	/**
	 * level up the guild if needed
	 * @param channel the channel where the display will be done
	 * @param language the language to use to display the message
	 */
	public async levelUpIfNeeded(channel: TextBasedChannel, language: string): Promise<void> {
		if (!this.needLevelUp()) {
			return;
		}
		const tr = Translations.getModule("models.guilds", language);
		this.experience -= this.getExperienceNeededToLevelUp();
		this.level++;
		const embed = new DraftBotEmbed()
			.setTitle(
				tr.format("levelUp.title", {
					guildName: this.name
				})
			)
			.setDescription(
				tr.format("levelUp.desc", {
					level: this.level
				})
			);
		await channel.send({embeds: [embed]});
		for (const member of await Entities.getByGuild(this.id)) {
			await MissionsController.update(member, channel, language, {
				missionId: "guildLevel",
				count: this.level,
				set: true
			});
		}

		if (this.needLevelUp()) {
			await this.levelUpIfNeeded(channel, language);
		}
	}

	/**
	 * get the guild's elder id
	 */
	public getElderId(): number {
		return this.elderId;
	}

	/**
	 * get the guild's chief id
	 */
	public getChiefId(): number {
		return this.chiefId;
	}

	/**
	 * check if the pet shelter is full
	 */
	public isPetShelterFull(): boolean {
		if (!this.GuildPets) {
			return true;
		}
		return this.GuildPets.length >= Data.getModule("models.pets").getNumber("slots");
	}

	/**
	 * check if the guild is at max level
	 */
	public isAtMaxLevel(): boolean {
		return this.level >= Constants.GUILD.MAX_LEVEL;
	}

	/**
	 * check the states of the guild storage for a given food type
	 * @param selectedItemType the food type to check
	 * @param quantity the quantity that need to be available
	 */
	public isStorageFullFor(selectedItemType: string, quantity: number): boolean {
		return this.getDataValue(selectedItemType) + quantity > Constants.GUILD.MAX_PET_FOOD[getFoodIndexOf(selectedItemType)];
	}

	/**
	 * add food to the guild storage
	 * @param selectedItemType the food type to add
	 * @param quantity the quantity to add
	 */
	public addFood(selectedItemType: string, quantity: number): void {
		this.setDataValue(selectedItemType, this.getDataValue(selectedItemType) + quantity);
		if (this.isStorageFullFor(selectedItemType, 0)) {
			this.setDataValue(selectedItemType, Constants.GUILD.MAX_PET_FOOD[getFoodIndexOf(selectedItemType)]);
		}
	}
}

export class Guilds {
	static getById(id: number): Promise<Guild> {
		return Promise.resolve(Guild.findOne({
			where: {
				id: id
			},
			include: [
				{
					model: GuildPet,
					as: "GuildPets",
					include: [
						{
							model: PetEntity,
							as: "PetEntity",
							include: [
								{
									model: Pet,
									as: "PetModel"
								}
							]
						}
					]
				}
			]
		}));
	}

	static getByName(name: string): Promise<Guild> {
		return Promise.resolve(Guild.findOne({
			where: {
				name: name
			},
			include: [
				{
					model: GuildPet,
					as: "GuildPets",
					include: [
						{
							model: PetEntity,
							as: "PetEntity",
							include: [
								{
									model: Pet,
									as: "PetModel"
								}
							]
						}
					]
				}
			]
		}));
	}

	static async getGuildLevelMean() {
		const query = `SELECT AVG(level) as avg
                       FROM Guilds`;
		return Math.round(
			(<{ avg: number }[]>(await Guild.sequelize.query(query, {
				type: QueryTypes.SELECT
			})))[0]["avg"]
		);
	}
}

export function initModel(sequelize: Sequelize): void {
	const guildsData = Data.getModule("models.guilds");

	Guild.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING(32) // eslint-disable-line new-cap
		},
		guildDescription: {
			type: DataTypes.STRING(300) // eslint-disable-line new-cap
		},
		score: {
			type: DataTypes.INTEGER,
			defaultValue: guildsData.getNumber("score")
		},
		level: {
			type: DataTypes.INTEGER,
			defaultValue: guildsData.getNumber("level")
		},
		experience: {
			type: DataTypes.INTEGER,
			defaultValue: guildsData.getNumber("experience")
		},
		commonFood: {
			type: DataTypes.INTEGER,
			defaultValue: guildsData.getNumber("commonFood")
		},
		carnivorousFood: {
			type: DataTypes.INTEGER,
			defaultValue: guildsData.getNumber("carnivorousFood")
		},
		herbivorousFood: {
			type: DataTypes.INTEGER,
			defaultValue: guildsData.getNumber("herbivorousFood")
		},
		ultimateFood: {
			type: DataTypes.INTEGER,
			defaultValue: guildsData.getNumber("ultimateFood")
		},
		lastDailyAt: {
			type: DataTypes.DATE,
			defaultValue: null
		},
		chiefId: {
			type: DataTypes.INTEGER
		},
		elderId: {
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
		tableName: "guilds",
		freezeTableName: true
	});

	Guild.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export function setAssociations(): void {
	Guild.hasMany(Player, {
		foreignKey: "guildId",
		as: "Members"
	});

	Guild.hasOne(Player, {
		foreignKey: "id",
		sourceKey: "chiefId",
		as: "Chief"
	});

	Guild.hasMany(GuildPet, {
		foreignKey: "guildId",
		as: "GuildPets"
	});
}

export default Guild;