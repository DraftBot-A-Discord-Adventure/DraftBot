import {
	Sequelize,
	Model,
	DataTypes, QueryTypes
} from "sequelize";
import {Data} from "../Data";
import GuildPet from "./GuildPet";
import PetEntity from "./PetEntity";
import Pet from "./Pet";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Message, TextChannel} from "discord.js";
import {Translations} from "../Translations";
import moment = require("moment");
import {MissionsController} from "../missions/MissionsController";
import {Entities} from "./Entity";
import {Constants} from "../Constants";

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


	public updateLastDailyAt(): void {
		const moment = require("moment");
		this.lastDailyAt = new moment(); // eslint-disable-line new-cap
	}

	public getExperienceNeededToLevelUp(): number {
		const data = Data.getModule("values");
		return (
			Math.round(
				data.getNumber("xp.baseValue") *
				Math.pow(data.getNumber("xp.coeff"), this.level + 1)
			) - data.getNumber("xp.minus")
		);
	}

	public setExperience(experience: number): void {
		if (experience > 0) {
			this.experience = experience;
		}
		else {
			this.experience = 0;
		}
	}

	public async addExperience(experience: number, message: Message, language: string) {
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
			await this.levelUpIfNeeded(<TextChannel> message.channel, language);
		}
	}

	public needLevelUp(): boolean {
		return this.experience >= this.getExperienceNeededToLevelUp();
	}

	public async levelUpIfNeeded(channel: TextChannel, language: string): Promise<void> {
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
			await MissionsController.update(member.discordUserId, channel, language, "guildLevel", this.level, null, true);
		}

		if (this.needLevelUp()) {
			await this.levelUpIfNeeded(channel, language);
		}
	}

	public getElderId(): number {
		return this.elderId;
	}

	public getChiefId(): number {
		return this.chiefId;
	}

	public isPetShelterFull(): boolean {
		if (!this.GuildPets) {
			return true;
		}
		return this.GuildPets.length >= Data.getModule("models.pets").getNumber("slots");
	}

	public isAtMaxLevel(): boolean {
		return this.level >= Constants.GUILD.MAX_LEVEL;
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

export function initModel(sequelize: Sequelize) {
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
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
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

export default Guild;