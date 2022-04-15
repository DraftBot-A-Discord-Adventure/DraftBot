import {DataTypes, Model, QueryTypes, Sequelize} from "sequelize";
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
import {CommandInteraction, Message, TextBasedChannel} from "discord.js";
import {Classes} from "./Class";
import Armor from "./Armor";
import Weapon from "./Weapon";
import Potion from "./Potion";
import ObjectItem from "./ObjectItem";
import {MissionsController} from "../missions/MissionsController";
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


	public async getCumulativeAttack(playerActiveObjects:{weapon: Weapon, armor: Armor, potion: Potion, object: ObjectItem}) {
		const playerClass = await Classes.getById(this.Player.class);
		const attackItemValue = playerActiveObjects.weapon.getAttack() > playerClass.getAttackValue(this.Player.level)
			? playerClass.getAttackValue(this.Player.level) : playerActiveObjects.weapon.getAttack();
		const attack = playerClass.getAttackValue(this.Player.level) + playerActiveObjects.object.getAttack() + attackItemValue + playerActiveObjects.armor.getAttack() +
			playerActiveObjects.potion.getAttack();
		return attack > 0 ? attack : 0;
	}

	public async getCumulativeDefense(playerActiveObjects:{weapon: Weapon, armor: Armor, potion: Potion, object: ObjectItem}) {
		const playerClass = await Classes.getById(this.Player.class);
		const defenseItemValue = playerActiveObjects.armor.getDefense() > playerClass.getDefenseValue(this.Player.level)
			? playerClass.getDefenseValue(this.Player.level) : playerActiveObjects.armor.getDefense();
		const defense = playerClass.getDefenseValue(this.Player.level) + playerActiveObjects.weapon.getDefense() + playerActiveObjects.object.getDefense() + defenseItemValue +
			playerActiveObjects.potion.getDefense();
		return defense > 0 ? defense : 0;
	}

	public async getCumulativeSpeed(playerActiveObjects:{weapon: Weapon, armor: Armor, potion: Potion, object: ObjectItem}) {
		const playerClass = await Classes.getById(this.Player.class);
		const speedItemValue = playerActiveObjects.object.getSpeed() / 2 > playerClass.getSpeedValue(this.Player.level)
			? playerClass.getSpeedValue(this.Player.level) + Math.round(playerActiveObjects.object.getSpeed() / 2)
			: playerActiveObjects.object.getSpeed();
		const speed = playerClass.getSpeedValue(this.Player.level) + playerActiveObjects.weapon.getSpeed() + playerActiveObjects.armor.getSpeed() +
			playerActiveObjects.potion.getSpeed() + speedItemValue;
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

	public async addHealth(health: number, channel: TextBasedChannel, language: string) {
		await this.setHealth(this.health + health, channel, language);
	}

	public async setHealth(health: number, channel: TextBasedChannel, language: string, shouldPokeMission = true) {
		const difference = (health > await this.getMaxHealth() ? await this.getMaxHealth() : health < 0 ? 0 : health) - this.health;
		if (difference > 0 && shouldPokeMission) {
			await MissionsController.update(this.discordUserId, channel, language, "earnLifePoints", difference);
		}
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

	public getMention(): string  {
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
				require("../../../../resources/text/campaign.json").missions[0]
			]
		}
	}

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
						include: [
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
							}]
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
						include: [
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
							}]
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
						include: [
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
							}]
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
						include: [
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
							}]
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

	static async getByOptions(interaction: CommandInteraction): Promise<Entity | null> {
		const user = interaction.options.getUser("user");
		if (user) {
			return (await Entities.getOrRegister(user.id))[0];
		}
		const rank = interaction.options.getNumber("rank");
		if (rank) {
			const [player] = await Players.getByRank(rank);
			if (player === undefined) {
				return null;
			}
			return await Entities.getById(player.entityId);
		}
		return null;
	}
}

export function initModel(sequelize: Sequelize): void  {
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