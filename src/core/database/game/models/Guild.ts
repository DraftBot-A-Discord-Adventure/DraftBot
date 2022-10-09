import {DataTypes, Model, QueryTypes, Sequelize} from "sequelize";
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
import {botConfig, draftBotInstance} from "../../../bot";
import {NumberChangeReason} from "../../logs/LogsDatabase";
import {PetEntityConstants} from "../../../constants/PetEntityConstants";
import {GuildConstants} from "../../../constants/GuildConstants";
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

	public creationDate!: Date;

	public updatedAt!: Date;

	public createdAt!: Date;


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
	public async completelyDestroyAndDeleteFromTheDatabase(): Promise<void> {
		draftBotInstance.logsDatabase.logGuildDestroy(this).then();
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
	 * add experience to the guild
	 * @param experience the experience to add
	 * @param channel the channel where the display will be done
	 * @param language the language to use to display the message
	 * @param reason The reason of the experience change
	 */
	public async addExperience(experience: number, channel: TextBasedChannel, language: string, reason: NumberChangeReason): Promise<void> {
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
		draftBotInstance.logsDatabase.logGuildExperienceChange(this, reason).then();
		await this.levelUpIfNeeded(channel, language);
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
		draftBotInstance.logsDatabase.logGuildLevelUp(this).then();
		draftBotInstance.logsDatabase.logGuildExperienceChange(this, NumberChangeReason.LEVEL_UP).then();
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

		await this.levelUpIfNeeded(channel, language);
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
		return this.GuildPets.length >= PetEntityConstants.SLOTS;
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
	 * @param reason change reason
	 */
	public addFood(selectedItemType: string, quantity: number, reason: NumberChangeReason): void {
		this.setDataValue(selectedItemType, this.getDataValue(selectedItemType) + quantity);
		if (this.isStorageFullFor(selectedItemType, 0)) {
			this.setDataValue(selectedItemType, Constants.GUILD.MAX_PET_FOOD[getFoodIndexOf(selectedItemType)]);
		}
		draftBotInstance.logsDatabase.logGuildsFoodChanges(this, getFoodIndexOf(selectedItemType), this.getDataValue(selectedItemType), reason).then();
	}

	/**
	 * remove food from the guid storage
	 * @param item
	 * @param quantity
	 * @param reason
	 */
	public removeFood(item: string, quantity: number, reason: NumberChangeReason): void {
		this.setDataValue(item, this.getDataValue(item) - quantity);
		draftBotInstance.logsDatabase.logGuildsFoodChanges(this, getFoodIndexOf(item), this.getDataValue(item), reason).then();
	}

	/**
	 * set the guild's experience
	 * @param experience
	 */
	private setExperience(experience: number): void {
		if (experience > 0) {
			this.experience = experience;
		}
		else {
			this.experience = 0;
		}
	}
}

export class Guilds {
	static getById(id: number): Promise<Guild> {
		return Promise.resolve(Guild.findOne({
			where: {
				id
			}
		}));
	}

	static getByName(name: string): Promise<Guild> {
		return Promise.resolve(Guild.findOne({
			where: {
				name
			}
		}));
	}

	static async getGuildLevelMean(): Promise<number> {
		const query = `SELECT AVG(level) as avg
					   FROM ${botConfig.MARIADB_PREFIX}_game.guilds`;
		return Math.round(
			(<{ avg: number }[]>(await Guild.sequelize.query(query, {
				type: QueryTypes.SELECT
			})))[0]["avg"]
		);
	}
}

export function initModel(sequelize: Sequelize): void {
	Guild.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: DataTypes.STRING(32), // eslint-disable-line new-cap
		guildDescription: DataTypes.STRING(300), // eslint-disable-line new-cap
		score: {
			type: DataTypes.INTEGER,
			defaultValue: GuildConstants.DEFAULT_VALUES.SCORE
		},
		level: {
			type: DataTypes.INTEGER,
			defaultValue: GuildConstants.DEFAULT_VALUES.LEVEL
		},
		experience: {
			type: DataTypes.INTEGER,
			defaultValue: GuildConstants.DEFAULT_VALUES.EXPERIENCE
		},
		commonFood: {
			type: DataTypes.INTEGER,
			defaultValue: GuildConstants.DEFAULT_VALUES.COMMON_FOOD
		},
		carnivorousFood: {
			type: DataTypes.INTEGER,
			defaultValue: GuildConstants.DEFAULT_VALUES.CARNIVOROUS_FOOD
		},
		herbivorousFood: {
			type: DataTypes.INTEGER,
			defaultValue: GuildConstants.DEFAULT_VALUES.HERBIVOROUS_FOOD
		},
		ultimateFood: {
			type: DataTypes.INTEGER,
			defaultValue: GuildConstants.DEFAULT_VALUES.ULTIMATE_FOOD
		},
		lastDailyAt: {
			type: DataTypes.DATE,
			defaultValue: null
		},
		chiefId: DataTypes.INTEGER,
		elderId: DataTypes.INTEGER,
		creationDate: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
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
	}).beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Guild;