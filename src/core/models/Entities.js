/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const Entities = Sequelize.define("Entities", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		maxHealth: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.entities.maxHealth
		},
		health: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.entities.health
		},
		attack: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.entities.attack
		},
		defense: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.entities.defense
		},
		speed: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.entities.speed
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
		tableName: "entities",
		freezeTableName: true
	});

	Entities.beforeSave((instance) => {
		instance.setDataValue("updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss"));
	});

	/**
	 * @param {String} discordUserId
	 */
	Entities.getOrRegister = (discordUserId) => Entities.findOrCreate({
		where: {
			discordUserId: discordUserId
		},
		defaults: {
			Player: {
				InventoryInfo: {

				},
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
				PlayerMissionsInfo: {

				},
				MissionSlots: [
					{
						missionId: "campaignIntro",
						missionVariant: 0,
						missionObjective: 1,
						expiresAt: null,
						numberDone: 0
					}
				]
			}
		},
		include: [
			{
				model: Players,
				as: "Player",
				include: [
					{
						model: InventorySlots,
						as: "InventorySlots"
					},
					{
						model: InventoryInfo,
						as: "InventoryInfo"
					},
					{
						model: PetEntities,
						as: "Pet",
						include: [
							{
								model: Pets,
								as: "PetModel"
							}
						]
					},
					{
						model: PlayerSmallEvents,
						as: "PlayerSmallEvents"
					},
					{
						model: MissionSlots,
						as: "MissionSlots",
						include: [
							{
								model: Missions,
								as: "Mission"
							}
						]
					},
					{
						model: PlayerMissionsInfo,
						as: "MissionsInfo"
					}]
			}]
	});

	/**
	 * @param {String} guildId
	 */
	Entities.getByGuild = (guildId) => Entities.findAll({
		defaults: {
			Player: {
				InventoryInfo: {

				},
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
				PlayerMissionsInfo: {

				},
				MissionSlots: [
					{
						missionId: "campaignIntro",
						missionVariant: 0,
						missionObjective: 1,
						expiresAt: null,
						numberDone: 0
					}
				]
			}
		},
		include: [
			{
				model: Players,
				as: "Player",
				where: {
					guildId: guildId
				},
				include: [
					{
						model: InventorySlots,
						as: "InventorySlots"
					},
					{
						model: InventoryInfo,
						as: "InventoryInfo"
					},
					{
						model: PetEntities,
						as: "Pet",
						include: [
							{
								model: Pets,
								as: "PetModel"
							}
						]
					},
					{
						model: PlayerSmallEvents,
						as: "PlayerSmallEvents"
					},
					{
						model: MissionSlots,
						as: "MissionSlots",
						include: [
							{
								model: Missions,
								as: "Mission"
							}
						]
					},
					{
						model: PlayerMissionsInfo,
						as: "MissionsInfo"
					}]
			}],
		order: [
			[{model: Players, as: "Player"}, "score", "DESC"],
			[{model: Players, as: "Player"}, "level", "DESC"]
		]
	});

	/**
	 * @param {String} discordUserId
	 */
	Entities.getByDiscordUserId = (discordUserId) => Entities.findOne({
		where: {
			discordUserId: discordUserId
		},
		defaults: {
			Player: {
				InventoryInfo: {

				},
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
				PlayerMissionsInfo: {

				},
				MissionSlots: [
					{
						missionId: "campaignIntro",
						missionVariant: 0,
						missionObjective: 1,
						expiresAt: null,
						numberDone: 0
					}
				]
			}
		},
		include: [
			{
				model: Players,
				as: "Player",
				include: [
					{
						model: InventorySlots,
						as: "InventorySlots"
					},
					{
						model: InventoryInfo,
						as: "InventoryInfo"
					},
					{
						model: PetEntities,
						as: "Pet",
						include: [
							{
								model: Pets,
								as: "PetModel"
							}
						]
					},
					{
						model: PlayerSmallEvents,
						as: "PlayerSmallEvents"
					},
					{
						model: MissionSlots,
						as: "MissionSlots",
						include: [
							{
								model: Missions,
								as: "Mission"
							}
						]
					},
					{
						model: PlayerMissionsInfo,
						as: "MissionsInfo"
					}]
			}]
	});

	/**
	 * @param {Number} id
	 */
	Entities.getById = (id) => Entities.findOne({
		where: {
			id: id
		},
		defaults: {
			Player: {
				InventoryInfo: {

				},
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
				]
			},
			PlayerMissionsInfo: {

			},
			MissionSlots: [
				{
					missionId: "campaignIntro",
					missionVariant: 0,
					missionObjective: 1,
					expiresAt: null,
					numberDone: 0
				}
			]
		},
		include: [
			{
				model: Players,
				as: "Player",
				include: [
					{
						model: InventorySlots,
						as: "InventorySlots"
					},
					{
						model: InventoryInfo,
						as: "InventoryInfo"
					},
					{
						model: PetEntities,
						as: "Pet",
						include: [
							{
								model: Pets,
								as: "PetModel"
							}
						]
					},
					{
						model: PlayerSmallEvents,
						as: "PlayerSmallEvents"
					},
					{
						model: MissionSlots,
						as: "MissionSlots",
						include: [
							{
								model: Missions,
								as: "Mission"
							}
						]
					},
					{
						model: PlayerMissionsInfo,
						as: "MissionsInfo"
					}]
			}]
	});

	Entities.getServerRank = (discordId, ids) => {
		const query = "SELECT rank " +
			"FROM (" +
				"SELECT entities.discordUserId AS discordUserId, (RANK() OVER (ORDER BY score DESC, players.level DESC)) AS rank " +
				"FROM entities " +
				"INNER JOIN players ON entities.id = players.entityId AND players.score > 100 " +
				"WHERE entities.discordUserId IN (:ids)) " +
			"WHERE discordUserId = :id;";
		return Sequelize.query(query, {
			replacements: {
				ids: ids,
				id: discordId
			},
			type: Sequelize.QueryTypes.SELECT
		});
	};

	/**
	 * @param {String[]} args=[]
	 * @param {module:"discord.js".Message} message
	 */
	Entities.getByArgs = async (args, message) => {
		if (isNaN(args[0])) {
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

	};

	/**
	 * Returns this player instance's current cumulative attack
	 * @param {Weapons} weapon
	 * @param {Armors} armor
	 * @param {Potions} potion
	 * @param {Objects} object
	 * @return {Number}
	 */
	Entities.prototype.getCumulativeAttack = async function(weapon, armor, potion, object) {
		const playerClass = await Classes.getById(this.Player.class);
		const attackItemValue = weapon.getAttack() > playerClass.getAttackValue(this.Player.level)
			? playerClass.getAttackValue(this.Player.level)	: weapon.getAttack();
		const attack = playerClass.getAttackValue(this.Player.level) + object.getAttack() + attackItemValue + armor.getAttack() +
			potion.getAttack();
		return attack > 0 ? attack : 0;
	};

	/**
	 * Returns this player instance's current cumulative defense
	 * @param {Weapons} weapon
	 * @param {Armors} armor
	 * @param {Potions} potion
	 * @param {Objects} object
	 * @return {Number}
	 */
	Entities.prototype.getCumulativeDefense = async function(weapon, armor, potion, object) {
		const playerClass = await Classes.getById(this.Player.class);
		const defenseItemValue = armor.getDefense() > playerClass.getDefenseValue(this.Player.level)
			? playerClass.getDefenseValue(this.Player.level) : armor.getDefense() ;
		const defense = playerClass.getDefenseValue(this.Player.level) + weapon.getDefense() + object.getDefense() + defenseItemValue +
			potion.getDefense();
		return defense > 0 ? defense : 0;
	};

	/**
	 * Returns this player instance's current cumulative speed
	 * @param {Weapons} weapon
	 * @param {Armors} armor
	 * @param {Potions} potion
	 * @param {Objects} object
	 * @return {Number}
	 */
	Entities.prototype.getCumulativeSpeed = async function(weapon, armor, potion, object) {
		const playerClass = await Classes.getById(this.Player.class);
		const speedItemValue = object.getSpeed() / 2 > playerClass.getSpeedValue(this.Player.level)
			? playerClass.getSpeedValue(this.Player.level) + Math.round(object.getSpeed() / 2)
			: object.getSpeed();
		const speed = playerClass.getSpeedValue(this.Player.level) + weapon.getSpeed() + armor.getSpeed() +
			potion.getSpeed() + speedItemValue;
		return speed > 0 ? speed : 0;
	};

	/**
	 * Returns this player instance's current cumulative health. Returns the regenerative health
	 * @return {Number}
	 */
	Entities.prototype.getCumulativeHealth = async function() {
		const maxHealth = await this.getMaxCumulativeHealth();
		let fp = maxHealth - this.fightPointsLost;
		if (fp < 0) {
			fp = 0;
		}
		else if (fp > maxHealth) {
			fp = maxHealth;
		}
		return fp;
	};

	/**
	 * Returns this player instance's max cumulative health
	 * @return {Number}
	 */
	Entities.prototype.getMaxHealth = async function() {
		const playerClass = await Classes.getById(this.Player.class);
		return playerClass.getMaxHealthValue(this.Player.level);
	};


	/**
	 * Returns this player instance's max cumulative health
	 * @return {Number}
	 */
	Entities.prototype.getMaxCumulativeHealth = async function() {
		const playerClass = await Classes.getById(this.Player.class);
		return playerClass.getMaxCumulativeHealthValue(this.Player.level);
	};

	/**
	 * @param {Number} health
	 */
	Entities.prototype.addHealth = async function(health) {
		this.health += health;
		await this.setHealth(this.health);
	};

	/**
	 * @param {Number} health
	 */
	Entities.prototype.setHealth = async function(health) {
		if (health < 0) {
			this.health = 0;
		}
		else if (health > await this.getMaxHealth()) {
			this.health = await this.getMaxHealth();
		}
		else {
			this.health = health;
		}
	};

	/**
	 * @return {String}
	 */
	Entities.prototype.getMention = function() {
		return "<@" + this.discordUserId + ">";
	};

	return Entities;
};
