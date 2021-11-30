import {
	Sequelize,
	Model,
	DataTypes, QueryTypes
} from "sequelize";
import {Data} from "../Data";
import InventorySlot from "./InventorySlot";
import InventoryInfo from "./InventoryInfo";
import PetEntity from "./PetEntity";
import Pet from "./Pet";
import PlayerSmallEvent from "./PlayerSmallEvent";
import MissionSlot from "./MissionSlot";
import Mission from "./Mission";
import PlayerMissionsInfo from "./PlayerMissionsInfo";
import Player, {Players} from "./Player";
import {Message} from "discord.js";
import {Classes} from "./Class";
import Armor from "./Armor";
import Weapon from "./Weapon";
import Potion from "./Potion";
import ObjectItem from "./ObjectItem";
import moment = require("moment");

export class Entity extends Model {
	public readonly id!: number;

	public maxHealth!: number;

	public health!: number;

	public attack!: number;

	public defense!: number;

	public speed!: number;

	public readonly discordUserId!: string;

	public fightPointsLost!: number;

	public updatedAt!: Date;

	public createdAt!: Date;


	public Player: Player;


	public async getCumulativeAttack(weapon: Weapon, armor: Armor, potion: Potion, object: ObjectItem) {
		const playerClass = await Classes.getById(this.Player.class);
		const attackItemValue = weapon.getAttack() > playerClass.getAttackValue(this.Player.level)
			? playerClass.getAttackValue(this.Player.level)	: weapon.getAttack();
		const attack = playerClass.getAttackValue(this.Player.level) + object.getAttack() + attackItemValue + armor.getAttack() +
			potion.getAttack();
		return attack > 0 ? attack : 0;
	}

	public async getCumulativeDefense(weapon: Weapon, armor: Armor, potion: Potion, object: ObjectItem) {
		const playerClass = await Classes.getById(this.Player.class);
		const defenseItemValue = armor.getDefense() > playerClass.getDefenseValue(this.Player.level)
			? playerClass.getDefenseValue(this.Player.level) : armor.getDefense() ;
		const defense = playerClass.getDefenseValue(this.Player.level) + weapon.getDefense() + object.getDefense() + defenseItemValue +
			potion.getDefense();
		return defense > 0 ? defense : 0;
	}

	public async getCumulativeSpeed(weapon: Weapon, armor: Armor, potion: Potion, object: ObjectItem) {
		const playerClass = await Classes.getById(this.Player.class);
		const speedItemValue = object.getSpeed() / 2 > playerClass.getSpeedValue(this.Player.level)
			? playerClass.getSpeedValue(this.Player.level) + Math.round(object.getSpeed() / 2)
			: object.getSpeed();
		const speed = playerClass.getSpeedValue(this.Player.level) + weapon.getSpeed() + armor.getSpeed() +
			potion.getSpeed() + speedItemValue;
		return speed > 0 ? speed : 0;
	}

	public async getCumulativeHealth() {
		const maxHealth = await this.getMaxCumulativeHealth();
		let fp = maxHealth - this.fightPointsLost;
		if (fp < 0) {
			fp = 0;
		}
		else if (fp > maxHealth) {
			fp = maxHealth;
		}
		return fp;
	}

	public async getMaxHealth() {
		const playerClass = await Classes.getById(this.Player.class);
		return playerClass.getMaxHealthValue(this.Player.level);
	}

	public async getMaxCumulativeHealth() {
		const playerClass = await Classes.getById(this.Player.class);
		return playerClass.getMaxCumulativeHealthValue(this.Player.level);
	}

	public async addHealth(health: number) {
		this.health += health;
		await this.setHealth(this.health);
	}

	public async setHealth(health: number) {
		if (health < 0) {
			this.health = 0;
		}
		else if (health > await this.getMaxHealth()) {
			this.health = await this.getMaxHealth();
		}
		else {
			this.health = health;
		}
	}

	public getMention() {
		return "<@" + this.discordUserId + ">";
	}
}

export class Entities {
	private static entityDefaultValues = {
		Player: {
			InventoryInfo: {},
			InventorySlots: [
				{
					itemId: 0,
					slot: 0,
					itemCategory: 0
				},
				{
					itemId: 0,
					slot: 0,
					itemCategory: 1
				},
				{
					itemId: 0,
					slot: 0,
					itemCategory: 2
				},
				{
					itemId: 0,
					slot: 0,
					itemCategory: 3
				}
			],
			PlayerMissionsInfo: {},
			MissionSlots: [
				{
					missionId: "campaignIntro",
					missionVariant: 0,
					missionObjective: 1,
					expiresAt: <Date>null,
					numberDone: 0,
					gemsToWin: 10,
					xpToWin: 10
				}
			]
		}
	}

	private static entityPlayerIncludes = [
		{
			model: InventorySlot,
			as: "InventorySlots"
		},
		{
			model: InventoryInfo,
			as: "InventoryInfo"
		},
		{
			model: PetEntity,
			as: "Pet",
			include: [
				{
					model: Pet,
					as: "PetModel"
				}
			]
		},
		{
			model: PlayerSmallEvent,
			as: "PlayerSmallEvents"
		},
		{
			model: MissionSlot,
			as: "MissionSlots",
			include: [
				{
					model: Mission,
					as: "Mission"
				}
			]
		},
		{
			model: PlayerMissionsInfo,
			as: "PlayerMissionsInfo"
		}];

	static getOrRegister(discordUserId: string): Promise<[Entity, boolean] | null> {
		return Promise.resolve(Entity.findOrCreate(
			{
				where: {
					discordUserId
				},
				defaults: this.entityDefaultValues,
				include: [
					{
						model: Player,
						as: "Player",
						include: this.entityPlayerIncludes
					}
				]
			}
		));
	}

	static getByGuild(guildId: number): Promise<Entity[]> {
		return Promise.resolve(Entity.findAll(
			{
				include: [
					{
						model: Player,
						as: "Player",
						where: {
							guildId: guildId
						},
						include: this.entityPlayerIncludes
					}
				],
				order: [
					[{model: Player, as: "Player"}, "score", "DESC"],
					[{model: Player, as: "Player"}, "level", "DESC"]
				]
			}
		));
	}

	static getByDiscordUserId(discordUserId: string): Promise<Entity | null> {
		return Promise.resolve(Entity.findOne(
			{
				where: {
					discordUserId
				},
				include: [
					{
						model: Player,
						as: "Player",
						include: this.entityPlayerIncludes
					}
				]
			}
		));
	}

	static getById(id: number): Promise<Entity | null> {
		return Promise.resolve(Entity.findOne(
			{
				where: {
					id
				},
				include: [
					{
						model: Player,
						as: "Player",
						include: this.entityPlayerIncludes
					}
				]
			}
		));
	}

	static getServerRank(discordId: string, ids: string[]): Promise<{ rank: number }[]> {
		const query = "SELECT rank " +
			"FROM (" +
			"SELECT entities.discordUserId AS discordUserId, (RANK() OVER (ORDER BY score DESC, players.level DESC)) AS rank " +
			"FROM entities " +
			"INNER JOIN players ON entities.id = players.entityId AND players.score > 100 " +
			"WHERE entities.discordUserId IN (:ids)) " +
			"WHERE discordUserId = :id;";
		return Entity.sequelize.query(query, {
			replacements: {
				ids: ids,
				id: discordId
			},
			type: QueryTypes.SELECT
		});
	}

	static async getByArgs(args: string[], message: Message) {
		if (isNaN(Number(args[0]))) {
			const lastMention = message.mentions.users.last();
			if (lastMention === undefined) {
				return [null];
			}
			return Entities.getOrRegister(lastMention.id);
		}
		const [player] = await Players.getByRank(parseInt(args[0]));
		if (player === undefined) {
			return [null];
		}
		return [await Entities.getById(player.entityId)];
	}
}

export function initModel(sequelize: Sequelize) {
	const data = Data.getModule("models.entities");

	Entity.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		maxHealth: {
			type: DataTypes.INTEGER,
			defaultValue: data.getNumber("maxHealth")
		},
		health: {
			type: DataTypes.INTEGER,
			defaultValue: data.getNumber("health")
		},
		attack: {
			type: DataTypes.INTEGER,
			defaultValue: data.getNumber("attack")
		},
		defense: {
			type: DataTypes.INTEGER,
			defaultValue: data.getNumber("defense")
		},
		speed: {
			type: DataTypes.INTEGER,
			defaultValue: data.getNumber("speed")
		},
		discordUserId: {
			type: DataTypes.STRING(64) // eslint-disable-line new-cap
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		fightPointsLost: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		}
	}, {
		sequelize,
		tableName: "entities",
		freezeTableName: true
	});

	Entity.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Entity;