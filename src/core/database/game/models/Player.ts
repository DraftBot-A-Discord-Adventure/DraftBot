import {DataTypes, Model, Op, QueryTypes, Sequelize} from "sequelize";
import InventorySlot, {InventorySlots} from "./InventorySlot";
import PetEntity from "./PetEntity";
import MissionSlot from "./MissionSlot";
import {InventoryInfos} from "./InventoryInfo";
import {DraftBotEmbed} from "../../../messages/DraftBotEmbed";
import {Constants} from "../../../Constants";
import Class, {Classes} from "./Class";
import MapLocation, {MapLocations} from "./MapLocation";
import {MapLinks} from "./MapLink";
import {Translations} from "../../../Translations";
import {CommandInteraction, TextBasedChannel, TextChannel} from "discord.js";
import {DraftBotPrivateMessage} from "../../../messages/DraftBotPrivateMessage";
import {GenericItemModel, MaxStatsValues} from "./GenericItemModel";
import {MissionsController} from "../../../missions/MissionsController";
import {escapeUsername} from "../../../utils/StringUtils";
import {botConfig, draftBotClient, draftBotInstance} from "../../../bot";
import {playerActiveObjects} from "./PlayerActiveObjects";
import {TopConstants} from "../../../constants/TopConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {PlayersConstants} from "../../../constants/PlayersConstants";
import {InventoryConstants} from "../../../constants/InventoryConstants";
import {minutesToHours} from "../../../utils/TimeUtils";
import {TravelTime} from "../../../maps/TravelTime";
import {EntityConstants} from "../../../constants/EntityConstants";
import {BlockingUtils} from "../../../utils/BlockingUtils";
import {BlockingConstants} from "../../../constants/BlockingConstants";
import moment = require("moment");

export type PlayerEditValueParameters = {
	player: Player,
	amount: number,
	channel: TextBasedChannel,
	language: string,
	reason: NumberChangeReason
}

export type EditValueParameters = {
	amount: number,
	channel: TextBasedChannel,
	language: string,
	reason: NumberChangeReason
}

type MissionHealthParameter = {
	shouldPokeMission: boolean,
	overHealCountsForMission: boolean
};

export class Player extends Model {
	public readonly id!: number;

	public discordUserId!: string;

	public health!: number;

	public fightPointsLost!: number;

	public score!: number;

	public weeklyScore!: number;

	public level!: number;

	public experience!: number;

	public money!: number;

	public class!: number;

	public badges: string;

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

	private pseudo: string;

	/**
	 * add a badge to a player
	 * @param badge
	 */
	public addBadge(badge: string): boolean {
		if (this.badges !== null) {
			if (!this.hasBadge(badge)) {
				this.badges += `-${badge}`;
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

	/**
	 * check if a player has a specific badge
	 * @param badge
	 */
	public hasBadge(badge: string): boolean {
		return this.badges === null ? false : this.badges.split("-")
			.includes(badge);
	}

	/**
	 * get the destination id of a player
	 */
	async getDestinationId(): Promise<number> {
		const link = await MapLinks.getById(this.mapLinkId);
		return link.endMap;
	}

	/**
	 * get the mapLocation object of the destination of the player
	 */
	public async getDestination(): Promise<MapLocation> {
		const link = await MapLinks.getById(this.mapLinkId);
		return await MapLocations.getById(link.endMap);
	}

	/**
	 * get the origin mapLocation object of the player
	 */
	public async getPreviousMap(): Promise<MapLocation> {
		const link = await MapLinks.getById(this.mapLinkId);
		return await MapLocations.getById(link.startMap);
	}

	/**
	 * get the origin id of the player
	 */
	public async getPreviousMapId(): Promise<number> {
		const link = await MapLinks.getById(this.mapLinkId);
		return link.startMap;
	}

	/**
	 * get the current trip duration of a player
	 */
	public async getCurrentTripDuration(): Promise<number> {
		const link = await MapLinks.getById(this.mapLinkId);
		return minutesToHours(link.tripDuration);
	}

	/**
	 * get the amount of experience needed to level up
	 */
	public getExperienceNeededToLevelUp(): number {
		return Math.round(
			Constants.XP.BASE_VALUE *
			Math.pow(Constants.XP.COEFFICIENT, this.level + 1)
		) - Constants.XP.MINUS;
	}

	/**
	 * Add or remove points from the score of a player
	 * @param parameters
	 */
	public async addScore(parameters: EditValueParameters): Promise<void> {
		this.score += parameters.amount;
		if (parameters.amount > 0) {
			await MissionsController.update(this, parameters.channel, parameters.language, {
				missionId: "earnPoints",
				count: parameters.amount
			});
		}
		await this.setScore(this.score, parameters.channel, parameters.language);
		draftBotInstance.logsDatabase.logScoreChange(this.discordUserId, this.score, parameters.reason).then();
		this.addWeeklyScore(parameters.amount);
	}

	/**
	 * add or remove money to the player
	 * @param parameters
	 */
	public async addMoney(parameters: EditValueParameters): Promise<void> {
		this.money += parameters.amount;
		if (parameters.amount > 0) {
			const newPlayer = await MissionsController.update(this, parameters.channel, parameters.language, {
				missionId: "earnMoney",
				count: parameters.amount
			});
			// Clone the mission entity and player to this player model and the entity instance passed in the parameters
			// As the money and experience may have changed, we update the models of the caller
			Object.assign(this, newPlayer);
		}
		this.setMoney(this.money);
		draftBotInstance.logsDatabase.logMoneyChange(this.discordUserId, this.money, parameters.reason).then();
	}

	/**
	 * get a player's pseudo
	 * @param language
	 */
	public getPseudo(language: string): string {
		this.setPseudo(language);
		return this.pseudo;
	}

	/**
	 * get the pseudo from the discord api + our custom treatment and saves it in the model
	 * @param language
	 */
	public setPseudo(language: string): void {
		if (this.discordUserId !== undefined) {
			if (draftBotClient.users.cache.get(this.discordUserId) !== undefined) {
				this.pseudo = escapeUsername(draftBotClient.users.cache.get(this.discordUserId).username);
			}
			else {
				this.pseudo = Translations.getModule("models.players", language).get("pseudo");
			}
		}
		else {
			this.pseudo = Translations.getModule("models.players", language).get("pseudo");
		}
	}

	/**
	 * Check if a player needs to level up
	 */
	public needLevelUp(): boolean {
		return this.experience >= this.getExperienceNeededToLevelUp();
	}

	/**
	 * Get the class group of a player
	 */
	public getClassGroup(): number {
		return this.level < Constants.CLASS.GROUP1LEVEL ? 0 :
			this.level < Constants.CLASS.GROUP2LEVEL ? 1 :
				this.level < Constants.CLASS.GROUP3LEVEL ? 2 :
					3;
	}

	/**
	 * Check if a player has to receive a reward for a level up
	 * @param language
	 * @param channel
	 */
	public async getLvlUpReward(language: string, channel: TextBasedChannel): Promise<string[]> {
		const tr = Translations.getModule("models.players", language);
		const bonuses = [];
		if (this.level === Constants.FIGHT.REQUIRED_LEVEL) {
			bonuses.push(tr.format("levelUp.fightUnlocked", {}));
		}
		if (this.level === Constants.GUILD.REQUIRED_LEVEL) {
			bonuses.push(tr.format("levelUp.guildUnlocked", {}));
		}

		if (this.level % 10 === 0) {
			await this.addHealth(await this.getMaxHealth() - this.health, channel, language, NumberChangeReason.LEVEL_UP, {
				shouldPokeMission: true,
				overHealCountsForMission: false
			});
			bonuses.push(tr.format("levelUp.healthRestored", {}));
		}

		if (this.level === Constants.CLASS.REQUIRED_LEVEL) {
			bonuses.push(tr.format("levelUp.classUnlocked", {}));
		}

		if (this.level === Constants.CLASS.GROUP1LEVEL) {
			bonuses.push(tr.format("levelUp.classTiertwo", {}));
		}
		if (this.level === Constants.CLASS.GROUP2LEVEL) {
			bonuses.push(tr.format("levelUp.classTierthree", {}));
		}
		if (this.level === Constants.CLASS.GROUP3LEVEL) {
			bonuses.push(tr.format("levelUp.classTierfour", {}));
		}
		if (this.level === Constants.MISSIONS.SLOT_2_LEVEL || this.level === Constants.MISSIONS.SLOT_3_LEVEL) {
			bonuses.push(tr.format("levelUp.newMissionSlot", {}));
		}

		bonuses.push(tr.format("levelUp.noBonuses", {}));
		return bonuses;
	}

	/**
	 * level up a player if he has enough experience
	 * @param channel
	 * @param language
	 */
	public async levelUpIfNeeded(channel: TextBasedChannel, language: string): Promise<void> {
		if (!this.needLevelUp()) {
			return;
		}

		const xpNeeded = this.getExperienceNeededToLevelUp();
		this.experience -= xpNeeded;
		draftBotInstance.logsDatabase.logExperienceChange(this.discordUserId, this.experience, NumberChangeReason.LEVEL_UP).then();
		this.level++;
		draftBotInstance.logsDatabase.logLevelChange(this.discordUserId, this.level).then();
		Object.assign(this, await MissionsController.update(this, channel, language, {
			missionId: "reachLevel",
			count: this.level,
			set: true
		}));
		const bonuses = await this.getLvlUpReward(language, channel);

		let msg = Translations.getModule("models.players", language).format("levelUp.mainMessage", {
			mention: this.getMention(),
			level: this.level
		});
		for (let i = 0; i < bonuses.length - 1; ++i) {
			msg += bonuses[i] + "\n";
		}
		msg += bonuses[bonuses.length - 1];
		await channel.send({content: msg});

		return this.levelUpIfNeeded(channel, language);
	}

	/**
	 * This function is called when a player receives an effect after a report
	 * @param timeMalus
	 * @param effectMalus
	 */
	public async setLastReportWithEffect(timeMalus: number, effectMalus: string): Promise<void> {
		await TravelTime.applyEffect(this, effectMalus, timeMalus, new Date(), NumberChangeReason.BIG_EVENT);
		await this.save();
	}

	/**
	 * Check if we need to kill the player (mouahaha)
	 * @param channel
	 * @param language
	 * @param reason
	 */
	public async killIfNeeded(channel: TextBasedChannel, language: string, reason: NumberChangeReason): Promise<boolean> {
		if (this.health > 0) {
			return false;
		}
		await TravelTime.applyEffect(this, EffectsConstants.EMOJI_TEXT.DEAD, 0, new Date(), reason);
		const tr = Translations.getModule("models.players", language);
		await channel.send({content: tr.format("ko", {pseudo: this.getPseudo(language)})});

		const guildMember = await (<TextChannel>channel).guild.members.fetch(this.discordUserId);
		const user = guildMember.user;
		this.dmNotification ? await user.send({embeds: [new DraftBotPrivateMessage(user, tr.get("koPM.title"), tr.get("koPM.description"), language)]})
			: channel.send({
				embeds: [new DraftBotEmbed()
					.setDescription(tr.get("koPM.description"))
					.setTitle(tr.get("koPM.title"))
					.setFooter({text: tr.get("dmDisabledFooter")})]
			});

		return true;
	}

	/**
	 * Check if the player has played recently
	 */
	public isInactive(): boolean {
		return this.startTravelDate.valueOf() + TopConstants.FIFTEEN_DAYS < Date.now();
	}

	/**
	 * Check if the current effect of a player is finished
	 * @param date
	 */
	public currentEffectFinished(date: Date): boolean {
		if (this.effect === EffectsConstants.EMOJI_TEXT.DEAD || this.effect === EffectsConstants.EMOJI_TEXT.BABY) {
			return false;
		}
		if (this.effect === EffectsConstants.EMOJI_TEXT.SMILEY) {
			return true;
		}
		if (!this.effectEndDate) {
			return true;
		}
		return this.effectEndDate.valueOf() < date.valueOf();
	}

	/**
	 * get the amount of time remaining before the effect ends
	 */
	public effectRemainingTime(): number {
		let remainingTime = 0;
		if (EffectsConstants.EMOJI_TEXT_LIST.includes(this.effect) || this.effect === EffectsConstants.EMOJI_TEXT.OCCUPIED) {
			if (!this.effectEndDate || this.effectEndDate.valueOf() === 0) {
				return 0;
			}
			remainingTime = this.effectEndDate.valueOf() - Date.now();
		}
		if (remainingTime < 0) {
			remainingTime = 0;
		}
		return remainingTime;
	}

	/**
	 * Check if the player is under some effect (except dead or baby)
	 */
	public checkEffect(): boolean {
		return [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.SMILEY, EffectsConstants.EMOJI_TEXT.DEAD].indexOf(this.effect) !== -1;
	}

	/**
	 * Check if the player is dead and needs to respawn
	 */
	public isDead(): boolean {
		return this.effect === EffectsConstants.EMOJI_TEXT.DEAD;
	}

	/**
	 * get the level of the player
	 */
	public getLevel(): number {
		return this.level;
	}

	/**
	 * get the number of player that are on the same map as the player
	 */
	public async getNbPlayersOnYourMap(): Promise<number> {
		const query = `SELECT COUNT(*) as count
					   FROM ${botConfig.MARIADB_PREFIX}_game.players
					   WHERE (mapLinkId = :link
						   OR mapLinkId = :linkInverse)
						 AND score
						   > ${Constants.MINIMAL_PLAYER_SCORE}`;
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

	/**
	 * gives an item to the player
	 * @param item
	 */
	public async giveItem(item: GenericItemModel): Promise<boolean> {
		const invSlots = await InventorySlots.getOfPlayer(this.id);
		const invInfo = await InventoryInfos.getOfPlayer(this.id);
		const category = item.getCategory();
		const equippedItem = invSlots.filter(slot => slot.itemCategory === category && slot.isEquipped())[0];
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
		const slotsLimit = invInfo.slotLimitForCategory(category);
		const items = invSlots.filter(slot => slot.itemCategory === category && slot.slot < slotsLimit);
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

	/**
	 * drink a potion
	 */
	public async drinkPotion(): Promise<void> {
		InventorySlot.findOne({
			where: {
				playerId: this.id,
				slot: 0,
				itemCategory: Constants.ITEM_CATEGORIES.POTION
			}
		}).then(async item => await draftBotInstance.logsDatabase.logItemSell(this.discordUserId, await item.getItem()));
		await InventorySlot.update(
			{
				itemId: InventoryConstants.POTION_DEFAULT_ID
			},
			{
				where: {
					slot: 0,
					itemCategory: Constants.ITEM_CATEGORIES.POTION,
					playerId: this.id
				}
			});
	}

	public async getMaxStatsValue(): Promise<MaxStatsValues> {
		const playerClass = await Classes.getById(this.class);
		return {
			attack: playerClass.getAttackValue(this.level),
			defense: playerClass.getDefenseValue(this.level),
			speed: playerClass.getSpeedValue(this.level)
		};
	}

	/**
	 * check if a player has an empty mission slot
	 */
	public hasEmptyMissionSlot(missionSlots: MissionSlot[]): boolean {
		return missionSlots.filter(slot => !slot.isCampaign()).length < this.getMissionSlots();
	}

	/**
	 * give experience to a player
	 * @param parameters
	 */
	public async addExperience(parameters: EditValueParameters): Promise<void> {
		this.experience += parameters.amount;
		draftBotInstance.logsDatabase.logExperienceChange(this.discordUserId, this.experience, parameters.reason).then();
		if (parameters.amount > 0) {
			const newPlayer = await MissionsController.update(this, parameters.channel, parameters.language, {
				missionId: "earnXP",
				count: parameters.amount
			});
			// Clone the mission entity and player to this player model and the entity instance passed in the parameters
			// As the money and experience may have changed, we update the models of the caller
			Object.assign(this, newPlayer);
		}

		await this.levelUpIfNeeded(parameters.channel, parameters.language);
	}

	/**
	 * get the amount of secondary mission a player can have at maximum
	 */
	public getMissionSlots(): number {
		return this.level >= Constants.MISSIONS.SLOT_3_LEVEL ? 3 : this.level >= Constants.MISSIONS.SLOT_2_LEVEL ? 2 : 1;
	}

	/**
	 * Set the pet of the player
	 * @param petEntity
	 */
	public setPet(petEntity: PetEntity): void {
		this.petId = petEntity.id;
		draftBotInstance.logsDatabase.logPlayerNewPet(this.discordUserId, petEntity).then();
	}

	/**
	 * calculate the cumulative attack of the player
	 * @param playerActiveObjects
	 */
	public async getCumulativeAttack(playerActiveObjects: playerActiveObjects): Promise<number> {
		const playerAttack = (await Classes.getById(this.class)).getAttackValue(this.level);
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
		const playerDefense = (await Classes.getById(this.class)).getDefenseValue(this.level);
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
		const playerSpeed = (await Classes.getById(this.class)).getSpeedValue(this.level);
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
		const playerClass = await Classes.getById(this.class);
		return playerClass.getMaxHealthValue(this.level);
	}

	/**
	 * get the player max cumulative fight point
	 */
	public async getMaxCumulativeFightPoint(): Promise<number> {
		const playerClass = await Classes.getById(this.class);
		return playerClass.getMaxCumulativeFightPointValue(this.level);
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
	 * allow to set the score of a player to a specific value this is only called from addScore
	 * @param score
	 * @param channel
	 * @param language
	 * @private
	 */
	private async setScore(score: number, channel: TextBasedChannel, language: string): Promise<void> {
		await MissionsController.update(this, channel, language, {missionId: "reachScore", count: score, set: true});
		if (score > 0) {
			this.score = score;
		}
		else {
			this.score = 0;
		}
	}

	/**
	 * allow to set the money of a player to a specific value this is only called from addMoney
	 * @param money
	 * @private
	 */
	private setMoney(money: number): void {
		if (money > 0) {
			this.money = money;
		}
		else {
			this.money = 0;
		}
	}

	/**
	 * add points to the weekly score of the player
	 * @param weeklyScore
	 * @private
	 */
	private addWeeklyScore(weeklyScore: number): void {
		this.weeklyScore += weeklyScore;
		this.setWeeklyScore(this.weeklyScore);
	}

	/**
	 * set the weekly score of the player to a specific value this is only called from addWeeklyScore
	 * @param weeklyScore
	 * @private
	 */
	private setWeeklyScore(weeklyScore: number): void {
		if (weeklyScore > 0) {
			this.weeklyScore = weeklyScore;
		}
		else {
			this.weeklyScore = 0;
		}
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

/**
 * this class is used to store information about players
 */
export class Players {
	/**
	 * get or create a player
	 * @param discordUserId
	 */
	static getOrRegister(discordUserId: string): Promise<[Player, boolean] | null> {
		return Promise.resolve(Player.findOrCreate(
			{
				where: {
					discordUserId
				}
			}
		));
	}


	/**
	 * get a player by guildId
	 * @param guildId
	 */
	static getByGuild(guildId: number): Promise<Player[]> {
		return Promise.resolve(Player.findAll(
			{
				where: {
					guildId
				},
				order: [
					["score", "DESC"],
					["level", "DESC"]
				]
			}
		));
	}

	/**
	 * get a player by discordUserId
	 * @param discordUserId
	 */
	static getByDiscordUserId(discordUserId: string): Promise<Player | null> {
		return Promise.resolve(Player.findOne(
			{
				where: {
					discordUserId
				}
			}
		));
	}

	/**
	 * get the ranking of the player compared to a list of players
	 * @param discordId
	 * @param ids - list of discordIds to compare to
	 * @param timing
	 */
	static async getRankFromUserList(discordId: string, ids: string[], timing: string): Promise<number> {
		const scoreLookup = timing === TopConstants.TIMING_ALLTIME ? "score" : "weeklyScore";
		const query = `SELECT rank
					   FROM (SELECT ${botConfig.MARIADB_PREFIX}_game.players.discordUserId,
									(RANK() OVER (ORDER BY ${botConfig.MARIADB_PREFIX}_game.players.${scoreLookup} DESC
										, ${botConfig.MARIADB_PREFIX}_game.players.level DESC)) AS rank
							 FROM ${botConfig.MARIADB_PREFIX}_game.players
							 WHERE ${botConfig.MARIADB_PREFIX}_game.players.discordUserId IN (${ids.toString()})) subquery
					   WHERE subquery.discordUserId = ${discordId};`;
		return ((await Player.sequelize.query(query))[0][0] as { rank: number }).rank;
	}

	/**
	 * get the rank of a player
	 * @param playerId
	 */
	static async getRankById(playerId: number): Promise<number> {
		return await this.getRank(playerId, Constants.RANK_TYPES.SCORE);
	}

	/**
	 * get the weekly rank of a player
	 * @param playerId
	 */
	static async getWeeklyRankById(playerId: number): Promise<number> {
		return await this.getRank(playerId, Constants.RANK_TYPES.WEEKLY_SCORE);
	}

	/**
	 * get the rank of a player related to a specific type of value
	 * @param playerId
	 * @param rankType
	 */
	static async getRank(playerId: number, rankType: string): Promise<number> {
		const query = `SELECT ranking
					   FROM (SELECT id, RANK() OVER (ORDER BY ${rankType} desc, level desc) ranking
							 FROM ${botConfig.MARIADB_PREFIX}_game.players) subquery
					   WHERE subquery.id = ${playerId}`;
		return ((await Player.sequelize.query(query))[0][0] as { ranking: number }).ranking;
	}

	/**
	 * get a player from the options of an interaction
	 * @param interaction
	 */
	static async getByOptions(interaction: CommandInteraction): Promise<Player | null> {
		const user = interaction.options.getUser("user");
		if (user) {
			return (await Players.getOrRegister(user.id))[0];
		}
		const rank = interaction.options.get("rank");
		if (rank) {
			const [player] = await Players.getByRank(rank.value as number);
			if (player === undefined) {
				return null;
			}
			return (await Players.getOrRegister(player.discordUserId))[0];
		}
		return null;
	}

	/**
	 * Get all the discord ids stored in the database
	 */
	static async getAllStoredDiscordIds(): Promise<string[]> {
		const query = `SELECT discordUserId
					   FROM ${botConfig.MARIADB_PREFIX}_game.players`;
		const queryResult = (await Player.sequelize.query(query, {
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
					   WHERE ${botConfig.MARIADB_PREFIX}_game.players.${timing === TopConstants.TIMING_ALLTIME ? "score" : "weeklyScore"}
						   > ${Constants.MINIMAL_PLAYER_SCORE}
						 AND ${botConfig.MARIADB_PREFIX}_game.players.discordUserId IN (${listDiscordId.toString()})`;
		const queryResult = await Player.sequelize.query(query);
		return (queryResult[0][0] as { nbPlayers: number }).nbPlayers;
	}

	/**
	 * Get the players in the list of Ids that will be printed into the top at the given page
	 * @param listDiscordId
	 * @param page
	 * @param timing
	 */
	static async getPlayersToPrintTop(listDiscordId: string[], page: number, timing: string): Promise<Player[]> {
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
		return await Player.findAll({
			where: {
				[Op.and]: {
					discordUserId: {
						[Op.in]: listDiscordId
					},
					...restrictionsTopEntering
				}
			},
			order: [
				[timing === TopConstants.TIMING_ALLTIME ? "score" : "weeklyScore", "DESC"],
				["level", "DESC"]
			],
			limit: TopConstants.PLAYERS_BY_PAGE,
			offset: (page - 1) * TopConstants.PLAYERS_BY_PAGE
		});
	}

	/**
	 * Get the player with the given rank
	 * @param rank
	 */
	static async getByRank(rank: number): Promise<Player[]> {
		const query = `SELECT *
					   FROM (SELECT *,
									RANK() OVER (ORDER BY score desc, level desc) rank, RANK() OVER (ORDER BY weeklyScore desc, level desc) weeklyRank
							 FROM ${botConfig.MARIADB_PREFIX}_game.players) subquery
					   WHERE subquery.rank = :rank`;
		return await Player.sequelize.query(query, {
			replacements: {
				rank
			},
			type: QueryTypes.SELECT
		});
	}

	static async getById(id: number): Promise<Player> {
		const query = `SELECT *
					   FROM (SELECT *,
									RANK() OVER (ORDER BY score desc, level desc) rank, RANK() OVER (ORDER BY weeklyScore desc, level desc) weeklyRank
							 FROM ${botConfig.MARIADB_PREFIX}_game.players) subquery
					   WHERE subquery.id = :id`;
		const playerToReturn = (await Player.sequelize.query<Player>(query, {
			replacements: {
				id
			},
			type: QueryTypes.SELECT
		}))[0] as Player;
		return (await Players.getOrRegister(playerToReturn.discordUserId))[0];
	}

	static async getNbMeanPoints(): Promise<number> {
		const query = `SELECT AVG(score) as avg
					   FROM ${botConfig.MARIADB_PREFIX}_game.players
					   WHERE score > ${Constants.MINIMAL_PLAYER_SCORE}`;
		return Math.round(
			(<{ avg: number }[]>(await Player.sequelize.query(query, {
				type: QueryTypes.SELECT
			})))[0].avg
		);
	}

	static async getMeanWeeklyScore(): Promise<number> {
		const query = `SELECT AVG(weeklyScore) as avg
					   FROM ${botConfig.MARIADB_PREFIX}_game.players
					   WHERE score > ${Constants.MINIMAL_PLAYER_SCORE}`;
		return Math.round(
			(<{ avg: number }[]>(await Player.sequelize.query(query, {
				type: QueryTypes.SELECT
			})))[0].avg
		);
	}

	static async getNbPlayersHaventStartedTheAdventure(): Promise<number> {
		const query = `SELECT COUNT(*) as count
					   FROM ${botConfig.MARIADB_PREFIX}_game.players
					   WHERE effect = ":baby:"`;
		return (<{ count: number }[]>(await Player.sequelize.query(query, {
			type: QueryTypes.SELECT
		})))[0].count;
	}

	static async getNbPlayersHaveStartedTheAdventure(): Promise<number> {
		const query = `SELECT COUNT(*) as count
					   FROM ${botConfig.MARIADB_PREFIX}_game.players
					   WHERE score > ${Constants.MINIMAL_PLAYER_SCORE}`;
		return (<{ count: number }[]>(await Player.sequelize.query(query, {
			type: QueryTypes.SELECT
		})))[0].count;
	}

	static async getLevelMean(): Promise<number> {
		const query = `SELECT AVG(level) as avg
					   FROM ${botConfig.MARIADB_PREFIX}_game.players
					   WHERE score > ${Constants.MINIMAL_PLAYER_SCORE}`;
		return Math.round(
			(<{ avg: number }[]>(await Player.sequelize.query(query, {
				type: QueryTypes.SELECT
			})))[0].avg
		);
	}

	static async getNbMeanMoney(): Promise<number> {
		const query = `SELECT AVG(money) as avg
					   FROM ${botConfig.MARIADB_PREFIX}_game.players
					   WHERE score > ${Constants.MINIMAL_PLAYER_SCORE}`;
		return Math.round(
			(<{ avg: number }[]>(await Player.sequelize.query(query, {
				type: QueryTypes.SELECT
			})))[0].avg
		);
	}

	static async getSumAllMoney(): Promise<number> {
		const query = `SELECT SUM(money) as sum
					   FROM ${botConfig.MARIADB_PREFIX}_game.players
					   WHERE score > ${Constants.MINIMAL_PLAYER_SCORE}`;
		return (<{ sum: number }[]>(await Player.sequelize.query(query, {
			type: QueryTypes.SELECT
		})))[0].sum;
	}

	static async getRichestPlayer(): Promise<number> {
		const query = `SELECT MAX(money) as max
					   FROM ${botConfig.MARIADB_PREFIX}_game.players`;
		return (<{ max: number }[]>(await Player.sequelize.query(query, {
			type: QueryTypes.SELECT
		})))[0].max;
	}

	static async getNbPlayersWithClass(classEntity: Class): Promise<number> {
		const query = `SELECT COUNT(*) as count
					   FROM ${botConfig.MARIADB_PREFIX}_game.players
					   WHERE class = :class
						 AND score
						   > ${Constants.MINIMAL_PLAYER_SCORE}`;
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

export function initModel(sequelize: Sequelize): void {
	Player.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		discordUserId: {
			type: DataTypes.STRING(64) // eslint-disable-line new-cap
		},
		health: {
			type: DataTypes.INTEGER,
			defaultValue: EntityConstants.DEFAULT_VALUES.HEALTH
		},
		fightPointsLost: {
			type: DataTypes.INTEGER,
			defaultValue: EntityConstants.DEFAULT_VALUES.FIGHT_POINTS_LOST
		},
		score: {
			type: DataTypes.INTEGER,
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.SCORE
		},
		weeklyScore: {
			type: DataTypes.INTEGER,
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.WEEKLY_SCORE
		},
		level: {
			type: DataTypes.INTEGER,
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.LEVEL
		},
		experience: {
			type: DataTypes.INTEGER,
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.EXPERIENCE
		},
		money: {
			type: DataTypes.INTEGER,
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.MONEY
		},
		class: {
			type: DataTypes.INTEGER,
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.CLASS
		},
		badges: {
			type: DataTypes.TEXT,
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.BADGES
		},
		guildId: {
			type: DataTypes.INTEGER,
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.GUILD_ID
		},
		topggVoteAt: {
			type: DataTypes.DATE,
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.TOP_GG_VOTE_AT
		},
		nextEvent: {
			type: DataTypes.INTEGER
		},
		petId: {
			type: DataTypes.INTEGER
		},
		lastPetFree: {
			type: DataTypes.DATE,
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.LAST_PET_FREE
		},
		effect: {
			type: DataTypes.STRING(32), // eslint-disable-line new-cap
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.EFFECT
		},
		effectEndDate: {
			type: DataTypes.DATE,
			defaultValue: new Date()
		},
		effectDuration: {
			type: DataTypes.INTEGER,
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.EFFECT_DURATION
		},
		mapLinkId: {
			type: DataTypes.INTEGER
		},
		startTravelDate: {
			type: DataTypes.DATE,
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.START_TRAVEL_DATE
		},
		dmNotification: {
			type: DataTypes.BOOLEAN,
			defaultValue: PlayersConstants.PLAYER_DEFAULT_VALUES.DM_NOTIFICATION
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
		tableName: "players",
		freezeTableName: true
	});

	Player.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Player;