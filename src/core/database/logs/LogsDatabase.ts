import {Database} from "../Database";
import {LogsPlayersMoney} from "./models/LogsPlayersMoney";
import {LogsPlayers} from "./models/LogsPlayers";
import {LogsPlayersHealth} from "./models/LogsPlayersHealth";
import {LogsPlayersExperience} from "./models/LogsPlayersExperience";
import {CreateOptions, Model, Transaction} from "sequelize";
import {LogsPlayersLevel} from "./models/LogsPlayersLevel";
import {LogsPlayersScore} from "./models/LogsPlayersScore";
import {LogsPlayersGems} from "./models/LogsPlayersGems";
import {LogsServers} from "./models/LogsServers";
import {LogsCommands} from "./models/LogsCommands";
import {LogsPlayersCommands} from "./models/LogsPlayersCommands";
import {LogsSmallEvents} from "./models/LogsSmallEvents";
import {LogsPlayersSmallEvents} from "./models/LogsPlayersSmallEvents";
import {LogsPossibilities} from "./models/LogsPossibilities";
import {LogsPlayersPossibilities} from "./models/LogsPlayersPossibilities";
import {LogsAlterations} from "./models/LogsAlterations";
import {Constants} from "../../Constants";
import {LogsPlayersStandardAlterations} from "./models/LogsPlayersStandardAlterations";
import {LogsPlayersOccupiedAlterations} from "./models/LogsPlayersOccupiedAlterations";
import {LogsUnlocks} from "./models/LogsUnlocks";
import {LogsPlayersClassChanges} from "./models/LogsPlayersClassChanges";
import {LogsPlayersVotes} from "./models/LogsPlayersVotes";
import {LogsServersJoins} from "./models/LogsServersJoins";
import {LogsServersQuits} from "./models/LogsServersQuits";
import MapLink from "../game/models/MapLink";
import {LogsPlayersTravels} from "./models/LogsPlayersTravels";
import {LogsMapLinks} from "./models/LogsMapLinks";
import {LogsMissionsFailed} from "./models/LogsMissionsFailed";
import {LogsMissionsFinished} from "./models/LogsMissionsFinished";
import {LogsMissionsFound} from "./models/LogsMissionsFound";
import {LogsMissionsDailyFinished} from "./models/LogsMissionsDailyFinished";
import {LogsMissionsDaily} from "./models/LogsMissionsDaily";
import {LogsMissionsCampaignProgresses} from "./models/LogsMissionsCampaignProgresses";
import {LogsMissions} from "./models/LogsMissions";
import {LogsPlayers15BestTopweek} from "./models/LogsPlayers15BestTopweek";
import {Entities} from "../game/models/Entity";
import {TopConstants} from "../../constants/TopConstants";
import {LogsItemGainsArmor} from "./models/LogsItemsGainsArmor";
import {GenericItemModel} from "../game/models/GenericItemModel";
import {LogsItemGainsObject} from "./models/LogsItemsGainsObject";
import {LogsItemGainsPotion} from "./models/LogsItemsGainsPotion";
import {LogsItemGainsWeapon} from "./models/LogsItemsGainsWeapon";
import {LogsItemSellsArmor} from "./models/LogsItemsSellsArmor";
import {LogsItemSellsObject} from "./models/LogsItemsSellsObject";
import {LogsItemSellsPotion} from "./models/LogsItemsSellsPotion";
import {LogsItemSellsWeapon} from "./models/LogsItemsSellsWeapon";
import {LogsPlayersTimewarps} from "./models/LogsPlayersTimewarps";
import PetEntity from "../game/models/PetEntity";
import {LogsPetsNicknames} from "./models/LogsPetsNickNames";
import {LogsPetEntities} from "./models/LogsPetEntities";
import {Guild} from "../game/models/Guild";
import {LogsGuilds} from "./models/LogsGuilds";
import {Player} from "../game/models/Player";
import {LogsGuildsKicks} from "./models/LogsGuildsKicks";
import {LogsDailyPotions} from "./models/LogsDailyPotions";
import {LogsClassicalShopBuyouts} from "./models/LogsClassicalShopBuyouts";
import {LogsGuildShopBuyouts} from "./models/LogsGuildShopBuyouts";
import {LogsMissionShopBuyouts} from "./models/LogsMissionShopBuyouts";
import {getFoodIndexOf} from "../../utils/FoodUtils";

export enum NumberChangeReason {
	// Default value. Used to detect missing parameters in functions
	NULL,

	// Value to use if you don't want to log the information, SHOULDN'T APPEAR IN THE DATABASE
	// You MUST also comment why you use this constant where you use it
	IGNORE,

	// Admin
	TEST,
	ADMIN,
	DEBUG,

	// Events
	BIG_EVENT,
	SMALL_EVENT,
	RECEIVE_COIN,

	// Pets
	PET_SELL,
	PET_FEED,
	PET_FREE,

	// Missions
	MISSION_FINISHED,
	MISSION_SHOP,

	// Guild
	GUILD_DAILY,
	GUILD_CREATE,

	// Items
	ITEM_SELL,
	DAILY,
	DRINK,

	// Misc
	SHOP,
	CLASS,
	UNLOCK,
	LEVEL_UP,
	RESPAWN,
}

export enum ShopItemType {
	DAILY_POTION,
	RANDOM_ITEM,
	ALTERATION_HEAL,
	FULL_REGEN,
	SLOT_EXTENSION,
	BADGE,
	COMMON_FOOD,
	HERBIVOROUS_FOOD,
	CARNIVOROUS_FOOD,
	ULTIMATE_FOOD,
	MONEY,
	TREASURE,
	POINTS,
	MISSION_SKIP,
	PET_INFORMATION,
	GUILD_XP,
}

type ModelType = { create: (values?: unknown, options?: CreateOptions<unknown>) => Promise<Model<unknown, unknown>> };

export class LogsDatabase extends Database {

	constructor() {
		super("logs");
	}

	private static getDate() {
		return Math.trunc(Date.now() / 1000);
	}

	public logMoneyChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayersMoney);
	}

	public logHealthChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayersHealth);
	}

	public logExperienceChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayersExperience);
	}

	public logScoreChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayersScore);
	}

	public logGemsChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayersGems);
	}

	public logLevelChange(discordId: string, level: number): Promise<void> {
		return this.logPlayerAndNumber(discordId, "level", level, LogsPlayersLevel);
	}

	public logCommandUsage(discordId: string, serverId: string, commandName: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player = await this.findOrCreatePlayer(discordId);
				const [server] = await LogsServers.findOrCreate({
					where: {
						discordId: serverId
					},
					transaction
				});
				const [command] = await LogsCommands.findOrCreate({
					where: {
						commandName
					},
					transaction
				});
				await LogsPlayersCommands.create({
					playerId: player.id,
					serverId: server.id,
					commandId: command.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logSmallEvent(discordId: string, name: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player = await this.findOrCreatePlayer(discordId);
				const [smallEvent] = await LogsSmallEvents.findOrCreate({
					where: {
						name
					},
					transaction
				});
				await LogsPlayersSmallEvents.create({
					playerId: player.id,
					smallEventId: smallEvent.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logBigEvent(discordId: string, eventId: number, possibilityEmote: string, issueIndex: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player = await this.findOrCreatePlayer(discordId);
				const [possibility] = await LogsPossibilities.findOrCreate({
					where: {
						bigEventId: eventId,
						emote: possibilityEmote === "end" ? null : possibilityEmote,
						issueIndex
					},
					transaction
				});
				await LogsPlayersPossibilities.create({
					playerId: player.id,
					bigEventId: eventId,
					possibilityId: possibility.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logAlteration(discordId: string, alteration: string, reason: NumberChangeReason, duration: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player = await this.findOrCreatePlayer(discordId);
				switch (alteration) {
				case Constants.EFFECT.OCCUPIED:
					await LogsPlayersOccupiedAlterations.create({
						playerId: player.id,
						duration: duration,
						reason: reason,
						date: LogsDatabase.getDate()
					}, {transaction});
					break;
				default:
					await LogsPlayersStandardAlterations.create({
						playerId: player.id,
						alterationId: (await LogsAlterations.findOrCreate({
							where: {
								alteration: alteration
							},
							transaction
						}))[0].id,
						reason,
						date: LogsDatabase.getDate()
					}, {transaction});
				}
				await transaction.commit();
				resolve();
			});
		});
	}

	public logUnlocks(buyerDiscordId: string, releasedDiscordId: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [buyer] = await LogsPlayers.findOrCreate({
					where: {
						discordId: buyerDiscordId
					},
					transaction
				});
				const [released] = await LogsPlayers.findOrCreate({
					where: {
						discordId: releasedDiscordId
					},
					transaction
				});
				await LogsUnlocks.create({
					buyerId: buyer.id,
					releasedId: released.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logPlayerClassChange(discordId: string, classId: number): Promise<void> {
		return this.logPlayerAndNumber(discordId, "classId", classId, LogsPlayersClassChanges);
	}

	public logVote(discordId: string): Promise<void> {
		return this.logSimplePlayerDate(discordId, LogsPlayersVotes);
	}

	public logMissionFailed(discordId: string, missionId: string, variant: number, objective: number): Promise<void> {
		return this.logMissionChange(discordId, missionId, variant, objective, LogsMissionsFailed);
	}

	public logMissionFinished(discordId: string, missionId: string, variant: number, objective: number): Promise<void> {
		return this.logMissionChange(discordId, missionId, variant, objective, LogsMissionsFinished);
	}

	public logMissionFound(discordId: string, missionId: string, variant: number, objective: number): Promise<void> {
		return this.logMissionChange(discordId, missionId, variant, objective, LogsMissionsFound);
	}

	public logMissionDailyFinished(discordId: string): Promise<void> {
		return this.logSimplePlayerDate(discordId, LogsMissionsDailyFinished);
	}

	public logMissionCampaignProgress(discordId: string, campaignIndex: number): Promise<void> {
		return this.logPlayerAndNumber(discordId, "number", campaignIndex, LogsMissionsCampaignProgresses);
	}

	public logMissionDailyRefreshed(missionId: string, variant: number, objective: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [mission] = await LogsMissions.findOrCreate({
					where: {
						name: missionId,
						variant,
						objective
					},
					transaction
				});
				await LogsMissionsDaily.create({
					missionId: mission.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logServerJoin(discordId: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [server] = await LogsServers.findOrCreate({
					where: {
						discordId: discordId
					},
					transaction
				});
				await LogsServersJoins.create({
					serverId: server.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logServerQuit(discordId: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [server] = await LogsServers.findOrCreate({
					where: {
						discordId: discordId
					},
					transaction
				});
				await LogsServersQuits.create({
					serverId: server.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logNewTravel(discordId: string, mapLink: MapLink): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player = await this.findOrCreatePlayer(discordId);
				const [maplinkLog] = await LogsMapLinks.findOrCreate({
					where: {
						start: mapLink.startMap,
						end: mapLink.endMap
					},
					transaction
				});
				await LogsPlayersTravels.create({
					playerId: player.id,
					mapLinkId: maplinkLog.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public log15BestTopweek(): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const entities = await Entities.getEntitiesToPrintTop(await Entities.getAllStoredDiscordIds(), 1, TopConstants.TIMING_WEEKLY);
				const now = LogsDatabase.getDate();
				for (let i = 0; i < entities.length; i++) {
					const player = await this.findOrCreatePlayer(entities[0].discordUserId);
					await LogsPlayers15BestTopweek.create({
						playerId: player.id,
						position: i + 1,
						topWeekScore: entities[i].Player.weeklyScore,
						date: now
					}, {transaction});
					resolve();
				}
				await transaction.commit();
			});
		});
	}

	public logItemGain(discordId: string, item: GenericItemModel) {
		let itemCategoryDatabase: { create: (values?: unknown, options?: CreateOptions<unknown>) => Promise<Model<unknown, unknown>> };
		switch (item.categoryName) {
		case "weapons":
			itemCategoryDatabase = LogsItemGainsWeapon;
			break;
		case "armors":
			itemCategoryDatabase = LogsItemGainsArmor;
			break;
		case "objects":
			itemCategoryDatabase = LogsItemGainsObject;
			break;
		case "potions":
			itemCategoryDatabase = LogsItemGainsPotion;
			break;
		default:
			break;
		}
		return this.logItem(discordId, item, itemCategoryDatabase);
	}

	public logItemSell(discordId: string, item: GenericItemModel) {
		let itemCategoryDatabase: { create: (values?: unknown, options?: CreateOptions<unknown>) => Promise<Model<unknown, unknown>> };
		switch (item.categoryName) {
		case "weapons":
			itemCategoryDatabase = LogsItemSellsWeapon;
			break;
		case "armors":
			itemCategoryDatabase = LogsItemSellsArmor;
			break;
		case "objects":
			itemCategoryDatabase = LogsItemSellsObject;
			break;
		case "potions":
			itemCategoryDatabase = LogsItemSellsPotion;
			break;
		default:
			break;
		}
		return this.logItem(discordId, item, itemCategoryDatabase);
	}

	public logTimewarp(discordId: string, time: number, reason: NumberChangeReason): Promise<void> {
		if (reason === NumberChangeReason.IGNORE) {
			return;
		}
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player = await this.findOrCreatePlayer(discordId);
				await LogsPlayersTimewarps.create({
					playerId: player.id,
					time,
					reason,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logPetNickname(petRenamed: PetEntity) {
		return new Promise(() => {
			this.sequelize.transaction().then(async (transaction) => {
				const pet = await this.findOrCreatePetEntity(petRenamed);
				await LogsPetsNicknames.create({
					petId: pet.id,
					name: petRenamed.nickname,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
			});
		});
	}

	public logGuildKick(guild: Guild, kickedDiscordId: string) {
		return new Promise(() => {
			this.sequelize.transaction().then(async (transaction) => {
				const logGuild = await this.findOrCreateGuild(guild);
				const kickedPlayer = await this.findOrCreatePlayer(kickedDiscordId);
				await LogsGuildsKicks.create({
					guildId: logGuild.id,
					kickedPlayer: kickedPlayer.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
			});
		});
	}

	public logDailyPotion(potionId: number) {
		return new Promise(() => {
			this.sequelize.transaction().then(async (transaction) => {
				await LogsDailyPotions.create({
					potionId,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
			});
		});
	}

	public logClassicalShopBuyout(discordId: string, shopItem: ShopItemType) {
		return new Promise(() => {
			this.sequelize.transaction().then(async (transaction) => {
				const logPlayer = await this.findOrCreatePlayer(discordId);
				await LogsClassicalShopBuyouts.create({
					playerId: logPlayer.id,
					shopItem,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
			});
		});
	}

	public logGuildShopBuyout(discordId: string, shopItem: ShopItemType) {
		return new Promise(() => {
			this.sequelize.transaction().then(async (transaction) => {
				const logPlayer = await this.findOrCreatePlayer(discordId);
				await LogsGuildShopBuyouts.create({
					playerId: logPlayer.id,
					shopItem,
					amount: 1,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
			});
		});
	}

	public logFoodGuildShopBuyout(discordId: string, shopItemName: string, amount: number) {
		const shopItem = getFoodIndexOf(shopItemName) + 6; // Les items de l'enum sont alignés avec les items du shop de guilde, décalés de 6
		return new Promise(() => {
			this.sequelize.transaction().then(async (transaction) => {
				const logPlayer = await this.findOrCreatePlayer(discordId);
				await LogsGuildShopBuyouts.create({
					playerId: logPlayer.id,
					shopItem,
					amount,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
			});
		});
	}

	public logMissionShopBuyout(discordId: string, shopItem: ShopItemType) {
		return new Promise(() => {
			this.sequelize.transaction().then(async (transaction) => {
				const logPlayer = await this.findOrCreatePlayer(discordId);
				await LogsMissionShopBuyouts.create({
					playerId: logPlayer.id,
					shopItem,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
			});
		});
	}

	private logPlayerAndNumber(discordId: string, valueFieldName: string, value: number, model: ModelType): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player = await this.findOrCreatePlayer(discordId);
				const values: { [key: string]: string | number } = {
					playerId: player.id,
					date: LogsDatabase.getDate()
				};
				values[valueFieldName] = value;
				await model.create(values, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	private logSimplePlayerDate(discordId: string, model: ModelType): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player = await this.findOrCreatePlayer(discordId);
				await model.create({
					playerId: player.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	private logMissionChange(discordId: string, missionId: string, variant: number, objective: number, model: ModelType): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player = await this.findOrCreatePlayer(discordId);
				const [mission] = await LogsMissions.findOrCreate({
					where: {
						name: missionId,
						variant,
						objective
					},
					transaction
				});
				await model.create({
					playerId: player.id,
					missionId: mission.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	private logNumberChange(discordId: string, value: number, reason: NumberChangeReason, model: ModelType): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player = await this.findOrCreatePlayer(discordId);
				await model.create({
					playerId: player.id,
					value,
					reason,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	private logItem(discordId: string, item: GenericItemModel, model: { create: (values?: unknown, options?: CreateOptions<unknown>) => Promise<Model<unknown, unknown>> }) {
		return new Promise(() => {
			this.sequelize.transaction().then(async (transaction: Transaction) => {
				const [player] = await LogsPlayers.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				await model.create({
					playerId: player.id,
					itemId: item.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
			});
		});
	}

	private findOrCreatePlayer(discordId: string): Promise<LogsPlayers> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction: Transaction) => {
				const [logPlayer] = await LogsPlayers.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				await transaction.commit();
				resolve(logPlayer);
			});
		});
	}

	private findOrCreatePetEntity(petEntity: PetEntity): Promise<LogsPetEntities> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction: Transaction) => {
				const logPetEntity = (await LogsPetEntities.findOrCreate({
					where: {
						gameId: petEntity.id,
						petId: petEntity.petId,
						isFemale: petEntity.sex === Constants.PETS.FEMALE,
						isDeleted: false
					},
					transaction
				}))[0];
				await transaction.commit();
				resolve(logPetEntity);
			});
		});
	}

	private findOrCreateGuild(guild: Guild): Promise<LogsGuilds> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction: Transaction) => {
				const logGuild = (await LogsGuilds.findOrCreate({
					where: {
						gameId: guild.id,
						name: guild.name,
						chiefId: (await this.findOrCreatePlayer(
							(await (await Player.findOne({where: {id: guild.chiefId}})).getEntity()).discordUserId
						)).id,
						isDeleted: false
					},
					transaction
				}))[0];
				await transaction.commit();
				resolve(logGuild);
			});
		});
	}
}