import {DataTypes, Model, QueryTypes, Sequelize} from "sequelize";
import InventorySlot from "./InventorySlot";
import PetEntity from "./PetEntity";
import PlayerSmallEvent from "./PlayerSmallEvent";
import MissionSlot from "./MissionSlot";
import PlayerMissionsInfo from "./PlayerMissionsInfo";
import InventoryInfo from "./InventoryInfo";
import {Data} from "../Data";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Constants} from "../Constants";
import Class, {Classes} from "./Class";
import MapLocation, {MapLocations} from "./MapLocation";
import {MapLinks} from "./MapLink";
import Entity from "./Entity";
import {Translations} from "../Translations";
import {Client, TextChannel} from "discord.js";
import {Maps} from "../Maps";
import {DraftBotPrivateMessage} from "../messages/DraftBotPrivateMessage";
import {minutesToMilliseconds} from "../utils/TimeUtils";
import {GenericItemModel} from "./GenericItemModel";
import {MissionsController} from "../missions/MissionsController";
import {escapeUsername} from "../utils/StringUtils";
import moment = require("moment");

declare const client: Client;

export class Player extends Model {
	public readonly id!: number;

	public score!: number;

	public weeklyScore!: number;

	public level!: number;

	public experience!: number;

	public money!: number;

	public class!: number;

	public badges: string;

	public readonly entityId!: number;

	public guildId: number;

	public topggVoteAt!: Date;

	public nextEvent!: number;

	public petId!: number;

	public lastPetFree!: Date;

	public effect!: string;

	public effectEndDate!: Date;

	public effectDuration!: number;

	public mapLinkId!: number;

	public startTravelDate!: Date;

	public dmNotification!: boolean;

	public updatedAt!: Date;

	public createdAt!: Date;


	public InventorySlots: InventorySlot[];

	public InventoryInfo: InventoryInfo;

	public Pet: PetEntity;

	public PlayerSmallEvents: PlayerSmallEvent[];

	public MissionSlots: MissionSlot[];

	public PlayerMissionsInfo: PlayerMissionsInfo;

	public getEntity: () => Entity;

	private pseudo: string;


	public addBadge(badge: string): boolean {
		if (this.badges !== null) {
			if (!this.hasBadge(badge)) {
				this.badges += "-" + badge;
			}
			else {
				return false;
			}
		}
		else {
			this.badges = badge;
		}
		return true;
	}

	public hasBadge(badge: string): boolean {
		return this.badges === null ? false : this.badges.split("-")
			.includes(badge);
	}

	async getDestinationId() {
		const link = await MapLinks.getById(this.mapLinkId);
		return link.endMap;
	}

	public async getDestination(): Promise<MapLocation> {
		const link = await MapLinks.getById(this.mapLinkId);
		return await MapLocations.getById(link.endMap);
	}

	public async getPreviousMap(): Promise<MapLocation> {
		const link = await MapLinks.getById(this.mapLinkId);
		return await MapLocations.getById(link.startMap);
	}

	public async getPreviousMapId(): Promise<number> {
		const link = await MapLinks.getById(this.mapLinkId);
		return link.startMap;
	}

	public async getCurrentTripDuration(): Promise<number> {
		const link = await MapLinks.getById(this.mapLinkId);
		return link.tripDuration;
	}

	public getExperienceNeededToLevelUp(): number {
		const data = Data.getModule("values");
		return Math.round(data.getNumber("xp.baseValue") * Math.pow(data.getNumber("xp.coeff"), this.level + 1)) - data.getNumber("xp.minus");
	}

	public async addScore(entity: Entity, score: number, channel: TextChannel, language: string): Promise<void> {
		this.score += score;
		if (score > 0) {
			await MissionsController.update(entity.discordUserId, channel, language, "earnPoints", score);
		}
		await this.setScore(entity, this.score, channel, language);
		this.addWeeklyScore(score);
	}

	public async setScore(entity: Entity, score: number, channel: TextChannel, language: string): Promise<void> {
		await MissionsController.update(entity.discordUserId, channel, language, "reachScore", score, null, true);
		if (score > 0) {
			this.score = score;
		}
		else {
			this.score = 0;
		}
	}

	public async addMoney(entity: Entity, money: number, channel: TextChannel, language: string): Promise<void> {
		this.money += money;
		if (money > 0) {
			await MissionsController.update(entity.discordUserId, channel, language, "earnMoney", money);
		}
		this.setMoney(this.money);
	}

	public setMoney(money: number): void {
		if (money > 0) {
			this.money = money;
		}
		else {
			this.money = 0;
		}
	}

	private addWeeklyScore(weeklyScore: number): void {
		this.weeklyScore += weeklyScore;
		this.setWeeklyScore(this.weeklyScore);
	}

	private setWeeklyScore(weeklyScore: number): void {
		if (weeklyScore > 0) {
			this.weeklyScore = weeklyScore;
		}
		else {
			this.weeklyScore = 0;
		}
	}

	public async getPseudo(language: string): Promise<string> {
		await this.setPseudo(language);
		return this.pseudo;
	}

	public async setPseudo(language: string): Promise<void> {
		const entity = await this.getEntity();
		if (entity.discordUserId !== undefined) {
			if (client.users.cache.get(entity.discordUserId) !== undefined) {
				this.pseudo = escapeUsername(client.users.cache.get(entity.discordUserId).username);
			}
			else {
				this.pseudo = Translations.getModule("models.players", language).get("pseudo");
			}
		}
		else {
			this.pseudo = Translations.getModule("models.players", language).get("pseudo");
		}
	}

	public needLevelUp(): boolean {
		return this.experience >= this.getExperienceNeededToLevelUp();
	}

	public getClassGroup(): number {
		return this.level < Constants.CLASS.GROUP1LEVEL ? 0 :
			this.level < Constants.CLASS.GROUP2LEVEL ? 1 :
				this.level < Constants.CLASS.GROUP3LEVEL ? 2 :
					3;
	}

	public async getLvlUpReward(language: string, entity: Entity): Promise<string[]> {
		const tr = Translations.getModule("models.players", language);
		const bonuses = [];
		if (this.level === Constants.FIGHT.REQUIRED_LEVEL) {
			bonuses.push(tr.get("levelUp.fightUnlocked"));
		}
		if (this.level === Constants.GUILD.REQUIRED_LEVEL) {
			bonuses.push(tr.get("levelUp.guildUnlocked"));
		}

		if (this.level % 10 === 0) {
			entity.health = await entity.getMaxHealth();
			bonuses.push(tr.get("levelUp.healthRestored"));
		}

		if (this.level === Constants.CLASS.REQUIRED_LEVEL) {
			bonuses.push(tr.get("levelUp.classUnlocked"));
		}

		if (this.level === Constants.CLASS.GROUP1LEVEL) {
			bonuses.push(tr.get("levelUp.classTiertwo"));
		}
		if (this.level === Constants.CLASS.GROUP2LEVEL) {
			bonuses.push(tr.get("levelUp.classTierthree"));
		}
		if (this.level === Constants.CLASS.GROUP3LEVEL) {
			bonuses.push(tr.get("levelUp.classTierfour"));
		}
		if (this.level === Constants.MISSIONS.SLOT_2_LEVEL || this.level === Constants.MISSIONS.SLOT_3_LEVEL) {
			bonuses.push(tr.get("levelUp.newMissionSlot"));
		}

		bonuses.push(tr.get("levelUp.noBonuses"));
		return bonuses;
	}

	public async levelUpIfNeeded(entity: Entity, channel: TextChannel, language: string): Promise<void> {
		if (!this.needLevelUp()) {
			return;
		}

		const xpNeeded = this.getExperienceNeededToLevelUp();
		this.experience -= xpNeeded;
		this.level++;
		await MissionsController.update(entity.discordUserId, channel, language, "reachLevel", this.level, null, true);
		const bonuses = await this.getLvlUpReward(language, entity);

		let msg = Translations.getModule("models.players", language).format("levelUp.mainMessage", {
			mention: entity.getMention(),
			level: this.level
		});
		for (let i = 0; i < bonuses.length - 1; ++i) {
			msg += bonuses[i] + "\n";
		}
		msg += bonuses[bonuses.length - 1];
		await channel.send({content: msg});

		if (this.needLevelUp()) {
			return this.levelUpIfNeeded(entity, channel, language);
		}
	}

	public async setLastReportWithEffect(time: number, timeMalus: number, effectMalus: string): Promise<void> {
		this.startTravelDate = new Date(time);
		await this.save();
		await Maps.applyEffect(this, effectMalus, timeMalus);
	}

	public async killIfNeeded(entity: Entity, channel: TextChannel, language: string): Promise<boolean> {
		if (entity.health > 0) {
			return false;
		}
		// TODO new logger
		// log("This user is dead : " + entity.discordUserId);
		await Maps.applyEffect(entity.Player, Constants.EFFECT.DEAD);
		const tr = Translations.getModule("models.players", language);
		await channel.send({content: tr.format("ko", {pseudo: await this.getPseudo(language)})});

		const guildMember = await channel.guild.members.fetch(entity.discordUserId);
		const user = guildMember.user;
		this.dmNotification ? user.send({embeds: [new DraftBotPrivateMessage(user, tr.get("koPM.title"), tr.get("koPM.description"), language)]})
			: channel.send({
				embeds: [new DraftBotEmbed()
					.setDescription(tr.get("koPM.description"))
					.setTitle(tr.get("koPM.title"))
					.setFooter(tr.get("dmDisabledFooter"))]
			});

		return true;
	}

	public isInactive(): boolean {
		return this.startTravelDate.valueOf() + minutesToMilliseconds(120) + Data.getModule("commands.top").getNumber("fifth10days") < Date.now();
	}

	public currentEffectFinished(): boolean {
		if (this.effect === Constants.EFFECT.DEAD || this.effect === Constants.EFFECT.BABY) {
			return false;
		}
		if (this.effect === Constants.EFFECT.SMILEY) {
			return true;
		}
		if (!this.effectEndDate) {
			return true;
		}
		return this.effectEndDate.valueOf() < Date.now();
	}

	public effectRemainingTime(): number {
		let remainingTime = 0;
		if (Data.getModule("models.players").exists("effectMalus." + this.effect) || this.effect === Constants.EFFECT.OCCUPIED) {
			if (!this.effectEndDate) {
				return 0;
			}
			remainingTime = this.effectEndDate.valueOf() - Date.now();
		}
		if (remainingTime < 0) {
			remainingTime = 0;
		}
		return remainingTime;
	}

	public checkEffect(): boolean {
		return [Constants.EFFECT.BABY, Constants.EFFECT.SMILEY, Constants.EFFECT.DEAD].indexOf(this.effect) !== -1;
	}

	public getLevel(): number {
		return this.level;
	}

	public async getNbPlayersOnYourMap(): Promise<number> {
		const query = `SELECT COUNT(*) as count
                       FROM Players
                       WHERE (mapLinkId = :link OR mapLinkId = :linkInverse)
                         AND score > 100`;
		const linkInverse = await MapLinks.getInverseLinkOf(this.mapLinkId);
		return Math.round(
			(<{ count: number }[]>(await Player.sequelize.query(query, {
				replacements: {
					link: this.mapLinkId,
					linkInverse: linkInverse.id
				},
				type: QueryTypes.SELECT
			})))[0].count
		);
	}

	public getMainWeaponSlot(): InventorySlot {
		const filtered = this.InventorySlots.filter(slot => slot.isEquipped() && slot.isWeapon());
		if (filtered.length === 0) {
			return null;
		}
		return filtered[0];
	}

	public getMainArmorSlot(): InventorySlot {
		const filtered = this.InventorySlots.filter(slot => slot.isEquipped() && slot.isArmor());
		if (filtered.length === 0) {
			return null;
		}
		return filtered[0];
	}

	public getMainPotionSlot(): InventorySlot {
		const filtered = this.InventorySlots.filter(slot => slot.isEquipped() && slot.isPotion());
		if (filtered.length === 0) {
			return null;
		}
		return filtered[0];
	}

	public getMainObjectSlot(): InventorySlot {
		const filtered = this.InventorySlots.filter(slot => slot.isEquipped() && slot.isObject());
		if (filtered.length === 0) {
			return null;
		}
		return filtered[0];
	}

	public async giveItem(item: GenericItemModel): Promise<boolean> {
		const category = item.getCategory();
		const equippedItem = this.InventorySlots.filter(slot => slot.itemCategory === category && slot.isEquipped())[0];
		if (equippedItem && equippedItem.itemId === 0) {
			await InventorySlot.update({
				itemId: item.id
			}, {
				where: {
					playerId: this.id,
					itemCategory: category,
					slot: equippedItem.slot
				}
			});
			return true;
		}
		const slotsLimit = this.InventoryInfo.slotLimitForCategory(category);
		const items = this.InventorySlots.filter(slot => slot.itemCategory === category && slot.slot < slotsLimit);
		if (items.length >= slotsLimit) {
			return false;
		}
		for (let i = 0; i < slotsLimit; ++i) {
			if (items.filter(slot => slot.slot === i).length === 0) {
				await InventorySlot.create({
					playerId: this.id,
					itemCategory: category,
					itemId: item.id,
					slot: i
				});
				return true;
			}
		}
		return false;
	}

	public async drinkPotion() {
		await InventorySlot.update(
			{
				itemId: Data.getModule("models.inventories").getNumber("potionId")
			},
			{
				where: {
					slot: 0,
					itemCategory: Constants.ITEM_CATEGORIES.POTION,
					playerId: this.id
				}
			});
	}

	public async getMaxStatsValue() {
		const playerClass = await Classes.getById(this.class);
		const attackItemValue = playerClass.getAttackValue(this.level);
		const defenseItemValue = playerClass.getDefenseValue(this.level);
		const speedItemValue = playerClass.getSpeedValue(this.level);
		return [attackItemValue, defenseItemValue, speedItemValue];
	}

	/**
	 * check if a player has an empty mission slot
	 */
	public hasEmptyMissionSlot(): boolean {
		return this.MissionSlots.filter(slot => !slot.isCampaign()).length < this.getMissionSlots();
	}

	/**
	 * give experience to a player
	 * @param xpWon
	 * @param entity
	 * @param channel
	 * @param language
	 */
	public async addExperience(xpWon: number, entity: Entity, channel: TextChannel, language: string) {
		this.experience += xpWon;
		if (xpWon > 0) {
			await MissionsController.update(entity.discordUserId, channel, language, "earnXP", xpWon);
		}
		while (this.needLevelUp()) {
			await this.levelUpIfNeeded(entity, channel, language);
		}
	}

	/**
	 * get the amount of secondary mission a player can have at maximum
	 */
	public getMissionSlots(): number {
		return this.level >= Constants.MISSIONS.SLOT_3_LEVEL ? 3 : this.level >= Constants.MISSIONS.SLOT_2_LEVEL ? 2 : 1;
	}
}

export class Players {
	static async getByRank(rank: number): Promise<Player[]> {
		const query = `SELECT *
                       FROM (SELECT entityId,
                                    RANK() OVER (ORDER BY score desc, level desc)       rank,
                                    RANK() OVER (ORDER BY weeklyScore desc, level desc) weeklyRank
                             FROM players)
                       WHERE rank = :rank`;
		return await Player.sequelize.query(query, {
			replacements: {
				rank: rank
			},
			type: QueryTypes.SELECT
		});
	}

	static async getById(id: number): Promise<Player> {
		const query = `SELECT *
                       FROM (SELECT id,
                                    RANK() OVER (ORDER BY score desc, level desc)       rank,
                                    RANK() OVER (ORDER BY weeklyScore desc, level desc) weeklyRank
                             FROM players)
                       WHERE id = :id`;
		return <Player><unknown>(await Player.sequelize.query(query, {
			replacements: {
				id: id
			},
			type: QueryTypes.SELECT
		}));
	}

	static async getNbMeanPoints(): Promise<number> {
		const query = `SELECT AVG(score) as avg
                       FROM Players
                       WHERE score > 100`;
		return Math.round(
			(<{ avg: number }[]>(await Player.sequelize.query(query, {
				type: QueryTypes.SELECT
			})))[0].avg
		);
	}

	static async getMeanWeeklyScore(): Promise<number> {
		const query = `SELECT AVG(weeklyScore) as avg
                       FROM Players
                       WHERE score > 100`;
		return Math.round(
			(<{ avg: number }[]>(await Player.sequelize.query(query, {
				type: QueryTypes.SELECT
			})))[0].avg
		);
	}

	static async getNbPlayersHaventStartedTheAdventure(): Promise<number> {
		const query = `SELECT COUNT(*) as count
                       FROM Players
                       WHERE effect = ":baby:"`;
		return (<{ count: number }[]>(await Player.sequelize.query(query, {
			type: QueryTypes.SELECT
		})))[0].count;
	}

	static async getLevelMean(): Promise<number> {
		const query = `SELECT AVG(level) as avg
                       FROM Players
                       WHERE score > 100`;
		return Math.round(
			(<{ avg: number }[]>(await Player.sequelize.query(query, {
				type: QueryTypes.SELECT
			})))[0].avg
		);
	}

	static async getNbMeanMoney(): Promise<number> {
		const query = `SELECT AVG(money) as avg
                       FROM Players
                       WHERE score > 100`;
		return Math.round(
			(<{ avg: number }[]>(await Player.sequelize.query(query, {
				type: QueryTypes.SELECT
			})))[0].avg
		);
	}

	static async getSumAllMoney(): Promise<number> {
		const query = `SELECT SUM(money) as sum
                       FROM Players
                       WHERE score > 100`;
		return (<{ sum: number }[]>(await Player.sequelize.query(query, {
			type: QueryTypes.SELECT
		})))[0].sum;
	}

	static async getRichestPlayer(): Promise<number> {
		const query = `SELECT MAX(money) as max
                       FROM Players`;
		return (<{ max: number }[]>(await Player.sequelize.query(query, {
			type: QueryTypes.SELECT
		})))[0].max;
	}

	static async getNbPlayersWithClass(classEntity: Class) {
		const query = `SELECT COUNT(*) as count
                       FROM Players
                       WHERE class = :class
                         AND score > 100`;
		return Math.round(
			(<{ count: number }[]>(await Player.sequelize.query(query, {
				replacements: {
					class: classEntity.id
				},
				type: QueryTypes.SELECT
			})))[0].count
		);
	}
}

export function initModel(sequelize: Sequelize) {
	const data = Data.getModule("models.players");

	Player.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		score: {
			type: DataTypes.INTEGER,
			defaultValue: data.getNumber("score")
		},
		weeklyScore: {
			type: DataTypes.INTEGER,
			defaultValue: data.getNumber("weeklyScore")
		},
		level: {
			type: DataTypes.INTEGER,
			defaultValue: data.getNumber("level")
		},
		experience: {
			type: DataTypes.INTEGER,
			defaultValue: data.getNumber("experience")
		},
		money: {
			type: DataTypes.INTEGER,
			defaultValue: data.getNumber("money")
		},
		class: {
			type: DataTypes.INTEGER,
			defaultValue: data.getNumber("class")
		},
		badges: {
			type: DataTypes.TEXT,
			defaultValue: null
		},
		entityId: {
			type: DataTypes.INTEGER
		},
		guildId: {
			type: DataTypes.INTEGER,
			defaultValue: null
		},
		topggVoteAt: {
			type: DataTypes.DATE,
			defaultValue: new Date(0)
		},
		nextEvent: {
			type: DataTypes.INTEGER
		},
		petId: {
			type: DataTypes.INTEGER
		},
		lastPetFree: {
			type: DataTypes.DATE,
			defaultValue: new Date(0)
		},
		effect: {
			type: DataTypes.STRING(32), // eslint-disable-line new-cap
			defaultValue: data.getString("effect")
		},
		effectEndDate: {
			type: DataTypes.DATE,
			defaultValue: new Date()
		},
		effectDuration: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		mapLinkId: {
			type: DataTypes.INTEGER
		},
		startTravelDate: {
			type: DataTypes.DATE,
			defaultValue: 0
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")()
				.format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")()
				.format("YYYY-MM-DD HH:mm:ss")
		},
		dmNotification: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		}
	}, {
		sequelize,
		tableName: "players",
		freezeTableName: true
	});

	Player.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Player;