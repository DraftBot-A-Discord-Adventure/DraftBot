import {DataTypes, Model, Op, QueryTypes, Sequelize} from "sequelize";
import InventorySlot from "./InventorySlot";
import InventoryInfo from "./InventoryInfo";
import PetEntity from "./PetEntity";
import Pet from "./Pet";
import PlayerSmallEvent from "./PlayerSmallEvent";
import MissionSlot from "./MissionSlot";
import Mission from "./Mission";
import PlayerMissionsInfo from "./PlayerMissionsInfo";
import Player, {Players} from "./Player";
import {CommandInteraction, TextBasedChannel} from "discord.js";
import {Classes} from "./Class";
import {MissionsController} from "../../../missions/MissionsController";
import {playerActiveObjects} from "./PlayerActiveObjects";
import {TopConstants} from "../../../constants/TopConstants";
import {Constants} from "../../../Constants";
import {BlockingUtils} from "../../../utils/BlockingUtils";
import {BlockingConstants} from "../../../constants/BlockingConstants";
import {botConfig, draftBotInstance} from "../../../bot";
import {NumberChangeReason} from "../../logs/LogsDatabase";
import {EntityConstants} from "../../../constants/EntityConstants";
import moment = require("moment");
import missionJson = require("resources/text/campaign.json");

type MissionHealthParameter = {
	shouldPokeMission: boolean,
	overHealCountsForMission: boolean
};

export class Entity extends Model {
	public readonly id!: number;

	public readonly discordUserId!: string;

	public maxHealth!: number;

	public health!: number;

	public attack!: number;

	public defense!: number;

	public speed!: number;

	public fightPointsLost!: number;

	public updatedAt!: Date;

	public createdAt!: Date;

	public Player: Player;

	/**
	 * get the list of all the active objects of the player
	 */
	public async getPlayerActiveObjects(): Promise<playerActiveObjects> {
		return await this.Player.getMainSlotsItems();
	}

	/**
	 * calculate the cumulative attack of the player
	 * @param playerActiveObjects
	 */
	public async getCumulativeAttack(playerActiveObjects: playerActiveObjects): Promise<number> {
		const playerAttack = (await Classes.getById(this.Player.class)).getAttackValue(this.Player.level);
		const attack = playerAttack
			+ (playerActiveObjects.weapon.getAttack() < playerAttack
				? playerActiveObjects.weapon.getAttack() : playerAttack)
			+ (playerActiveObjects.armor.getAttack() < playerAttack
				? playerActiveObjects.armor.getAttack() : playerAttack)
			+ playerActiveObjects.object.getAttack()
			+ playerActiveObjects.potion.getAttack();
		return attack > 0 ? attack : 0;
	}

	/**
	 * calculate the cumulative defense of the player
	 * @param playerActiveObjects
	 */
	public async getCumulativeDefense(playerActiveObjects: playerActiveObjects): Promise<number> {
		const playerDefense = (await Classes.getById(this.Player.class)).getDefenseValue(this.Player.level);
		const defense = playerDefense
			+ (playerActiveObjects.weapon.getDefense() < playerDefense
				? playerActiveObjects.weapon.getDefense() : playerDefense)
			+ (playerActiveObjects.armor.getDefense() < playerDefense
				? playerActiveObjects.armor.getDefense() : playerDefense)
			+ playerActiveObjects.object.getDefense()
			+ playerActiveObjects.potion.getDefense();
		return defense > 0 ? defense : 0;
	}

	/**
	 * calculate the cumulative speed of the player
	 * @param playerActiveObjects
	 */
	public async getCumulativeSpeed(playerActiveObjects: playerActiveObjects): Promise<number> {
		const playerSpeed = (await Classes.getById(this.Player.class)).getSpeedValue(this.Player.level);
		const speed = playerSpeed
			+ (playerActiveObjects.weapon.getSpeed() < playerSpeed
				? playerActiveObjects.weapon.getSpeed() : playerSpeed)
			+ (playerActiveObjects.armor.getSpeed() < playerSpeed
				? playerActiveObjects.armor.getSpeed() : playerSpeed)
			+ (playerActiveObjects.object.getSpeed() / 2 < playerSpeed
				? playerActiveObjects.object.getSpeed()
				: playerSpeed * 2)
			+ playerActiveObjects.potion.getSpeed();
		return speed > 0 ? speed : 0;
	}

	/**
	 * get the player cumulative Health
	 */
	public async getCumulativeFightPoint(): Promise<number> {
		const maxHealth = await this.getMaxCumulativeFightPoint();
		let fp = maxHealth - this.fightPointsLost;
		if (fp < 0) {
			fp = 0;
		}
		else if (fp > maxHealth) {
			fp = maxHealth;
		}
		return fp;
	}

	/**
	 * return the player max health
	 */
	public async getMaxHealth(): Promise<number> {
		const playerClass = await Classes.getById(this.Player.class);
		return playerClass.getMaxHealthValue(this.Player.level);
	}

	/**
	 * get the player max cumulative fight point
	 */
	public async getMaxCumulativeFightPoint(): Promise<number> {
		const playerClass = await Classes.getById(this.Player.class);
		return playerClass.getMaxCumulativeFightPointValue(this.Player.level);
	}

	/**
	 * add health to the player
	 * @param health
	 * @param channel
	 * @param language
	 * @param reason
	 * @param missionHealthParameter
	 */
	public async addHealth(health: number, channel: TextBasedChannel, language: string, reason: NumberChangeReason, missionHealthParameter: MissionHealthParameter = {
		overHealCountsForMission: true,
		shouldPokeMission: true
	}): Promise<void> {
		await this.setHealth(this.health + health, channel, language, missionHealthParameter);
		draftBotInstance.logsDatabase.logHealthChange(this.discordUserId, this.health, reason).then();
	}

	/**
	 * get the string that mention the user
	 */
	public getMention(): string {
		return `<@${this.discordUserId}>`;
	}

	/**
	 * returns true if the player is currently blocked by a report
	 */
	public async isInEvent(): Promise<boolean> {
		const blockingReasons = await BlockingUtils.getPlayerBlockingReason(this.discordUserId);
		return blockingReasons.includes(BlockingConstants.REASONS.REPORT) || blockingReasons.includes(BlockingConstants.REASONS.CHOOSE_DESTINATION);
	}

	/**
	 * set the player health
	 * @param health
	 * @param channel
	 * @param language
	 * @param missionHealthParameter
	 */
	private async setHealth(health: number, channel: TextBasedChannel, language: string, missionHealthParameter: MissionHealthParameter = {
		overHealCountsForMission: true,
		shouldPokeMission: true
	}): Promise<void> {
		const difference = (health > await this.getMaxHealth() && !missionHealthParameter.overHealCountsForMission ? await this.getMaxHealth() : health < 0 ? 0 : health)
			- this.health;
		if (difference > 0 && missionHealthParameter.shouldPokeMission) {
			await MissionsController.update(this, channel, language, {missionId: "earnLifePoints", count: difference});
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
				missionJson.missions[0]
			]
		}
	};

	/**
	 * get or create an entity
	 * @param discordUserId
	 */
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

	/**
	 * get an entity by guildId
	 * @param guildId
	 */
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

	/**
	 * get an entity by discordUserId
	 * @param discordUserId
	 */
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

	/**
	 * get an entity by entity id
	 * @param id
	 */
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

	/**
	 * get the ranking of the entity compared to a list of entities
	 * @param discordId
	 * @param ids - list of discordIds to compare to
	 * @param timing
	 */
	static async getRankFromUserList(discordId: string, ids: string[], timing: string): Promise<number> {
		const scoreLookup = timing === TopConstants.TIMING_ALLTIME ? "score" : "weeklyScore";
		const query = `SELECT rank
					   FROM (SELECT ${botConfig.MARIADB_PREFIX}_game.entities.discordUserId,
                                       (RANK() OVER (ORDER BY ${botConfig.MARIADB_PREFIX}_game.players.${scoreLookup} DESC
								  , ${botConfig.MARIADB_PREFIX}_game.players.level DESC)) AS rank
							 FROM ${botConfig.MARIADB_PREFIX}_game.entities
								 INNER JOIN ${botConfig.MARIADB_PREFIX}_game.players
							 ON ${botConfig.MARIADB_PREFIX}_game.entities.id = ${botConfig.MARIADB_PREFIX}_game.players.entityId AND ${botConfig.MARIADB_PREFIX}_game.players.${scoreLookup} > ${Constants.MINIMAL_PLAYER_SCORE}
							 WHERE ${botConfig.MARIADB_PREFIX}_game.entities.discordUserId IN (${ids.toString()})) subquery
					   WHERE subquery.discordUserId = ${discordId};`;
		return ((await Entity.sequelize.query(query))[0][0] as { rank: number }).rank;
	}

	/**
	 * get an entity from the options of an interaction
	 * @param interaction
	 */
	static async getByOptions(interaction: CommandInteraction): Promise<Entity | null> {
		const user = interaction.options.getUser("user");
		if (user) {
			return (await Entities.getOrRegister(user.id))[0];
		}
		const rank = interaction.options.get("rank");
		if (rank) {
			const [player] = await Players.getByRank(rank.value as number);
			if (player === undefined) {
				return null;
			}
			return await Entities.getById(player.entityId);
		}
		return null;
	}

	/**
	 * Get all the discord ids stored in the database
	 */
	static async getAllStoredDiscordIds(): Promise<string[]> {
		const query = `SELECT discordUserId
					   FROM ${botConfig.MARIADB_PREFIX}_game.entities`;
		const queryResult = (await Entity.sequelize.query(query, {
			type: QueryTypes.SELECT
		})) as { discordUserId: string }[];
		const discordIds: string[] = [];
		queryResult.forEach(res => discordIds.push(res.discordUserId));
		return discordIds;
	}

	/**
	 * Get the number of players that are considered playing the game inside the list of ids
	 * @param listDiscordId
	 * @param timing
	 */
	static async getNumberOfPlayingPlayersInList(listDiscordId: string[], timing: string): Promise<number> {
		const query = `SELECT COUNT(*) as nbPlayers
					   FROM ${botConfig.MARIADB_PREFIX}_game.players
                       		JOIN ${botConfig.MARIADB_PREFIX}_game.entities
					   ON ${botConfig.MARIADB_PREFIX}_game.entities.id = ${botConfig.MARIADB_PREFIX}_game.players.entityId
					   WHERE ${botConfig.MARIADB_PREFIX}_game.players.${timing === TopConstants.TIMING_ALLTIME ? "score" : "weeklyScore"}
						   > ${Constants.MINIMAL_PLAYER_SCORE}
						 AND ${botConfig.MARIADB_PREFIX}_game.entities.discordUserId IN (${listDiscordId.toString()})`;
		const queryResult = await Entity.sequelize.query(query);
		return (queryResult[0][0] as { nbPlayers: number }).nbPlayers;
	}

	/**
	 * Get the entities in the list of Ids that will be printed into the top at the given page
	 * @param listDiscordId
	 * @param page
	 * @param timing
	 */
	static async getEntitiesToPrintTop(listDiscordId: string[], page: number, timing: string): Promise<Entity[]> {
		const restrictionsTopEntering = timing === TopConstants.TIMING_ALLTIME
			? {
				score: {
					[Op.gt]: Constants.MINIMAL_PLAYER_SCORE
				}
			}
			: {
				weeklyScore: {
					[Op.gt]: Constants.MINIMAL_PLAYER_SCORE
				}
			};
		return await Entity.findAll({
			where: {
				discordUserId: {
					[Op.in]: listDiscordId
				}
			},
			include: [{
				model: Player,
				as: "Player",
				where: restrictionsTopEntering
			}],
			order: [
				[{
					model: Player,
					as: "Player"
				}, timing === TopConstants.TIMING_ALLTIME ? "score" : "weeklyScore", "DESC"],
				[{model: Player, as: "Player"}, "level", "DESC"]
			],
			limit: TopConstants.PLAYERS_BY_PAGE,
			offset: (page - 1) * TopConstants.PLAYERS_BY_PAGE
		});
	}
}

export function initModel(sequelize: Sequelize): void {
	Entity.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		discordUserId: {
			type: DataTypes.STRING(64) // eslint-disable-line new-cap
		},
		maxHealth: {
			type: DataTypes.INTEGER,
			defaultValue: EntityConstants.DEFAULT_VALUES.MAX_HEALTH
		},
		health: {
			type: DataTypes.INTEGER,
			defaultValue: EntityConstants.DEFAULT_VALUES.HEALTH
		},
		attack: {
			type: DataTypes.INTEGER,
			defaultValue: EntityConstants.DEFAULT_VALUES.ATTACK
		},
		defense: {
			type: DataTypes.INTEGER,
			defaultValue: EntityConstants.DEFAULT_VALUES.DEFENSE
		},
		speed: {
			type: DataTypes.INTEGER,
			defaultValue: EntityConstants.DEFAULT_VALUES.SPEED
		},
		fightPointsLost: {
			type: DataTypes.INTEGER,
			defaultValue: EntityConstants.DEFAULT_VALUES.FIGHT_POINTS_LOST
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
		tableName: "entities",
		freezeTableName: true
	});

	Entity.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export function setAssociations(): void {
	Entity.hasOne(Player, {
		foreignKey: "entityId",
		as: "Player"
	});
}

export default Entity;