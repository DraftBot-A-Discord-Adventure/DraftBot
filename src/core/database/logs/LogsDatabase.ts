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
import {LogsPetsNicknames} from "./models/LogsPetsNicknames";
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
import {LogsDailyTimeouts} from "./models/LogsDailyTimeouts";
import {LogsTopWeekEnd} from "./models/LogsTopWeekEnd";
import {GuildDailyConstants} from "../../constants/GuildDailyConstants";
import {LogsGuildsDailies} from "./models/LogsGuildsDailies";
import {LogsPetsTransfers} from "./models/LogsPetsTransfers";
import {LogsGuildsLeaves} from "./models/LogsGuildsLeaves";
import {LogsGuildsDestroys} from "./models/LogsGuildsDestroys";
import {LogsGuildsEldersRemoves} from "./models/LogsGuildsEldersRemoves";
import {LogsGuildsChiefsChanges} from "./models/LogsGuildsChiefsChanges";
import {LogsPetsFrees} from "./models/LogsPetsFrees";
import GuildPet from "../game/models/GuildPet";
import {FightController} from "../../fights/FightController";
import {LogsFightsResults} from "./models/LogsFightsResults";
import {LogsFightsActionsUsed} from "./models/LogsFightsActionsUsed";
import {LogsFightsActions} from "./models/LogsFightsActions";
import {LogsGuildsCreations} from "./models/LogsGuildCreations";
import {LogsGuildsJoins} from "./models/LogsGuildJoins";
import {LogsGuildsExperiences} from "./models/LogsGuildsExperiences";
import {LogsGuildsLevels} from "./models/LogsGuildsLevels";
import {LogsPetsTrades} from "./models/LogsPetsTrades";
import {LogsGuildsDescriptionChanges} from "./models/LogsGuildsDescriptionChanges";
import {LogsGuildsEldersAdds} from "./models/LogsGuildsEldersAdds";
import {LogsPetsSells} from "./models/LogsPetsSells";
import {LogsPetsLovesChanges} from "./models/LogsPetsLovesChanges";
import {LogsGuildsFoodsChanges} from "./models/LogsGuildsFoodsChanges";
import {LogsGuildsNewPets} from "./models/LogsGuildsNewPets";
import {LogsPlayersNewPets} from "./models/LogsPlayersNewPets";
import {EffectsConstants} from "../../constants/EffectsConstants";
import {LogsPlayersDailies} from "./models/LogsPlayersDailies";

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

type GuildLikeType = {
	id: number,
	name: string,
	creationDate: Date,
	chiefId: number,
	guildPets: GuildPet[]
}

export class LogsDatabase extends Database {

	constructor() {
		super("logs");
	}

	private static getDate(): number {
		return Math.trunc(Date.now() / 1000);
	}

	private static async logPetTradeTransaction(firstPet: PetEntity, secondPet: PetEntity, transaction: Transaction): Promise<void> {
		const firstLogPetEntity = await LogsDatabase.findOrCreatePetEntity(firstPet);
		const secondLogPetEntity = await LogsDatabase.findOrCreatePetEntity(secondPet);
		await LogsPetsTrades.create({
			firstPetId: firstLogPetEntity.id,
			secondPetId: secondLogPetEntity.id,
			date: LogsDatabase.getDate()
		}, {transaction});
	}

	private static async logPetFreeTransaction(freedPet: PetEntity, transaction: Transaction): Promise<void> {
		const logPetEntity = await LogsDatabase.findOrCreatePetEntity(freedPet);
		await LogsPetsFrees.create({
			petId: logPetEntity.id,
			date: LogsDatabase.getDate()
		}, {transaction});
	}

	private static async logPetSellTransaction(soldPet: PetEntity, sellerId: string, buyerId: string, price: number, transaction: Transaction): Promise<void> {
		const logPetEntity = await LogsDatabase.findOrCreatePetEntity(soldPet);
		const seller = await LogsDatabase.findOrCreatePlayer(sellerId);
		const buyer = await LogsDatabase.findOrCreatePlayer(buyerId);
		await LogsPetsSells.create({
			petId: logPetEntity.id,
			sellerId: seller.id,
			buyerId: buyer.id,
			price,
			date: LogsDatabase.getDate()
		}, {transaction});
	}

	private static async findOrCreatePlayer(discordId: string): Promise<LogsPlayers> {
		return (await LogsPlayers.findOrCreate({
			where: {
				discordId
			}
		}))[0];
	}

	private static async findOrCreatePetEntity(petEntity: PetEntity): Promise<LogsPetEntities> {
		return (await LogsPetEntities.findOrCreate({
			where: {
				gameId: petEntity.id,
				creationTimestamp: Math.floor(petEntity.creationDate.valueOf() / 1000.0)
			}
		}))[0];
	}

	private static async findOrCreateGuild(guild: Guild | GuildLikeType): Promise<LogsGuilds> {
		return (await LogsGuilds.findOrCreate({
			where: {
				gameId: guild.id,
				creationTimestamp: Math.floor(guild.creationDate.valueOf() / 1000.0)
			},
			defaults: {
				name: guild.name
			}
		}))[0];
	}

	private static async logGuildLeaveTransaction(guild: Guild | GuildLikeType, leftDiscordId: string, transaction: Transaction): Promise<void> {
		const logGuild = await LogsDatabase.findOrCreateGuild(guild);
		const leftPlayer = await LogsDatabase.findOrCreatePlayer(leftDiscordId);
		await LogsGuildsLeaves.create({
			guildId: logGuild.id,
			leftPlayer: leftPlayer.id,
			date: LogsDatabase.getDate()
		}, {transaction});
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
				const player = await LogsDatabase.findOrCreatePlayer(discordId);
				const [server] = await LogsServers.findOrCreate({
					where: {
						discordId: serverId
					}
				});
				const [command] = await LogsCommands.findOrCreate({
					where: {
						commandName
					}
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
				const player = await LogsDatabase.findOrCreatePlayer(discordId);
				const [smallEvent] = await LogsSmallEvents.findOrCreate({
					where: {
						name
					}
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
				const player = await LogsDatabase.findOrCreatePlayer(discordId);
				const [possibility] = await LogsPossibilities.findOrCreate({
					where: {
						bigEventId: eventId,
						emote: possibilityEmote === "end" ? null : possibilityEmote,
						issueIndex
					}
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
				const player = await LogsDatabase.findOrCreatePlayer(discordId);
				switch (alteration) {
				case EffectsConstants.EMOJI_TEXT.OCCUPIED:
					await LogsPlayersOccupiedAlterations.create({
						playerId: player.id,
						duration: duration,
						reason: reason,
						date: LogsDatabase.getDate()
					});
					break;
				default:
					await LogsPlayersStandardAlterations.create({
						playerId: player.id,
						alterationId: (await LogsAlterations.findOrCreate({
							where: {
								alteration: alteration
							}
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
					}
				});
				const [released] = await LogsPlayers.findOrCreate({
					where: {
						discordId: releasedDiscordId
					}
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
					}
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
					}
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
					}
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
				const player = await LogsDatabase.findOrCreatePlayer(discordId);
				const [maplinkLog] = await LogsMapLinks.findOrCreate({
					where: {
						start: mapLink.startMap,
						end: mapLink.endMap
					}
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

	public log15BestTopWeek(): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const entities = await Entities.getEntitiesToPrintTop(await Entities.getAllStoredDiscordIds(), 1, TopConstants.TIMING_WEEKLY);
				const now = LogsDatabase.getDate();
				for (let i = 0; i < entities.length; i++) {
					const player = await LogsDatabase.findOrCreatePlayer(entities[0].discordUserId);
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

	public logItemGain(discordId: string, item: GenericItemModel): Promise<unknown> {
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

	public logTimeWarp(discordId: string, time: number, reason: NumberChangeReason): Promise<void> {
		if (reason === NumberChangeReason.IGNORE) {
			return;
		}
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player = await LogsDatabase.findOrCreatePlayer(discordId);
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

	public logItemSell(discordId: string, item: GenericItemModel): Promise<unknown> {
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

	public logPetNickname(petRenamed: PetEntity): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const pet = await LogsDatabase.findOrCreatePetEntity(petRenamed);
				await LogsPetsNicknames.create({
					petId: pet.id,
					name: petRenamed.nickname,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logDailyPotion(potionId: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				await LogsDailyPotions.create({
					potionId,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logGuildKick(guild: Guild, kickedDiscordId: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const logGuild = await LogsDatabase.findOrCreateGuild(guild);
				const kickedPlayer = await LogsDatabase.findOrCreatePlayer(kickedDiscordId);
				await LogsGuildsKicks.create({
					guildId: logGuild.id,
					kickedPlayer: kickedPlayer.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logClassicalShopBuyout(discordId: string, shopItem: ShopItemType): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const logPlayer = await LogsDatabase.findOrCreatePlayer(discordId);
				await LogsClassicalShopBuyouts.create({
					playerId: logPlayer.id,
					shopItem,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logGuildShopBuyout(discordId: string, shopItem: ShopItemType): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const logPlayer = await LogsDatabase.findOrCreatePlayer(discordId);
				await LogsGuildShopBuyouts.create({
					playerId: logPlayer.id,
					shopItem,
					amount: 1,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logFoodGuildShopBuyout(discordId: string, shopItemName: string, amount: number): Promise<void> {
		const shopItem = getFoodIndexOf(shopItemName) + 6; // Les items de l'enum sont alignés sur les items du shop de guilde, c'est-à-dire décalés de 6.
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const logPlayer = await LogsDatabase.findOrCreatePlayer(discordId);
				await LogsGuildShopBuyouts.create({
					playerId: logPlayer.id,
					shopItem,
					amount,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logDailyTimeout(petLoveChange: boolean): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				await LogsDailyTimeouts.create({
					petLoveChange,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logTopWeekEnd(): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				await LogsTopWeekEnd.create({
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logMissionShopBuyout(discordId: string, shopItem: ShopItemType): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const logPlayer = await LogsDatabase.findOrCreatePlayer(discordId);
				await LogsMissionShopBuyouts.create({
					playerId: logPlayer.id,
					shopItem,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logGuildDaily(guild: Guild, rewardResult: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const logGuild = await LogsDatabase.findOrCreateGuild(guild);
				const reward = Object.values(GuildDailyConstants.REWARD_TYPES).indexOf(rewardResult);
				await LogsGuildsDailies.create({
					guildId: logGuild.id,
					reward,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logGuildLeave(guild: Guild | GuildLikeType, leftDiscordId: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				await LogsDatabase.logGuildLeaveTransaction(guild, leftDiscordId, transaction);
				await transaction.commit();
				resolve();
			});
		});
	}

	public logPetTransfer(guildPet: PetEntity, playerPet: PetEntity): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const logGuildPet = guildPet ? await LogsDatabase.findOrCreatePetEntity(guildPet) : null;
				const logPlayerPet = playerPet ? await LogsDatabase.findOrCreatePetEntity(playerPet) : null;
				await LogsPetsTransfers.create({
					playerPetId: logPlayerPet ? logPlayerPet.id : null,
					guildPetId: logGuildPet ? logGuildPet.id : null,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public async logGuildDestroy(guild: Guild): Promise<void> {
		const guildInfos: GuildLikeType = {
			id: guild.id,
			name: guild.name,
			creationDate: guild.creationDate,
			chiefId: guild.chiefId,
			guildPets: guild.GuildPets
		};
		const logGuild = await LogsDatabase.findOrCreateGuild(guildInfos);
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				for (const member of await Entities.getByGuild(guildInfos.id)) {
					if (member.id !== guildInfos.chiefId) {
						await LogsDatabase.logGuildLeaveTransaction(guild, member.discordUserId, transaction);
					}
				}
				for (const guildPet of guildInfos.guildPets) {
					await LogsDatabase.logPetFreeTransaction(guildPet.PetEntity, transaction);
				}
				await LogsGuildsDestroys.create({
					guildId: logGuild.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logGuildElderRemove(guild: Guild, removedPlayerId: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const logGuild = await LogsDatabase.findOrCreateGuild(guild);
				await LogsGuildsEldersRemoves.create({
					guildId: logGuild.id,
					removedElder: (await LogsDatabase.findOrCreatePlayer(
						(await (await Player.findOne({where: {id: removedPlayerId}})).getEntity()).discordUserId
					)).id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public async logGuildChiefChange(guild: Guild, newChiefId: number): Promise<void> {
		const logGuild = await LogsDatabase.findOrCreateGuild(guild);
		const logNewChiefId = (await LogsDatabase.findOrCreatePlayer(
			(await (await Player.findOne({where: {id: newChiefId}})).getEntity()).discordUserId
		)).id;
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				await LogsGuildsChiefsChanges.create({
					guildId: logGuild.id,
					newChief: logNewChiefId,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logPetFree(freedPet: PetEntity): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				await LogsDatabase.logPetFreeTransaction(freedPet, transaction);
				await transaction.commit();
				resolve();
			});
		});
	}

	public logPetTrade(firstPet: PetEntity, secondPet: PetEntity): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				await LogsDatabase.logPetTradeTransaction(firstPet, secondPet, transaction);
				await transaction.commit();
				resolve();
			});
		});
	}

	public logGuildCreation(creatorDiscordId: string, guild: Guild): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const creator = await LogsDatabase.findOrCreatePlayer(creatorDiscordId);
				const guildInstance = await LogsDatabase.findOrCreateGuild(guild);
				await LogsGuildsCreations.create({
					guildId: guildInstance.id,
					creatorId: creator.id,
					date: LogsDatabase.getDate()
				});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logGuildJoin(adderDiscordId: string | null, addedDiscordId: string, guild: Guild): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const adder = await LogsDatabase.findOrCreatePlayer(adderDiscordId);
				const added = await LogsDatabase.findOrCreatePlayer(addedDiscordId);
				const guildInstance = await LogsDatabase.findOrCreateGuild(guild);
				await LogsGuildsJoins.create({
					guildId: guildInstance.id,
					adderId: adder.id,
					addedId: added.id,
					date: LogsDatabase.getDate()
				});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logFight(fight: FightController): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player1 = fight.fightInitiator;
				const player1Id = (await LogsDatabase.findOrCreatePlayer(player1.entity.discordUserId)).id;
				const player2 = fight.fighters[0] === player1 ? fight.fighters[1] : fight.fighters[0];
				const player2Id = (await LogsDatabase.findOrCreatePlayer(player2.entity.discordUserId)).id;
				const winner = fight.getWinner() === 0 && player1 === fight.fighters[0] ? 1 : 2;
				const fightResult = await LogsFightsResults.create({
					player1Id: player1Id,
					player1Points: player1.entity.Player.score,
					player2Id: player2Id,
					player2Points: player2.entity.Player.score,
					turn: fight.turn,
					winner: fight.isADraw() ? 0 : winner,
					friendly: fight.friendly,
					date: LogsDatabase.getDate()
				}, {transaction});
				for (const player of [player1, player2]) {
					const fightActionsUsed: { [action: string]: number } = {};
					for (const fightAction of player.fightActionsHistory) {
						fightActionsUsed[fightAction] ? fightActionsUsed[fightAction]++ : fightActionsUsed[fightAction] = 1;
					}
					for (const [action, count] of Object.entries(fightActionsUsed)) {
						const [fightAction] = await LogsFightsActions.findOrCreate({
							where: {
								name: action
							}
						});
						await LogsFightsActionsUsed.create({
							fightId: fightResult.id,
							player: player === player1 ? 1 : 2,
							actionId: fightAction.id,
							count
						}, {transaction});
					}
				}
				await transaction.commit();
				resolve();
			});
		});
	}

	public logGuildExperienceChange(guild: Guild, reason: NumberChangeReason): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const guildInstance = await LogsDatabase.findOrCreateGuild(guild);
				await LogsGuildsExperiences.create({
					guildId: guildInstance.id,
					experience: guild.experience,
					reason,
					date: LogsDatabase.getDate()
				});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logGuildDescriptionChange(discordId: string, guild: Guild): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player = await LogsDatabase.findOrCreatePlayer(discordId);
				const guildInstance = await LogsDatabase.findOrCreateGuild(guild);
				await LogsGuildsDescriptionChanges.create({
					guildId: guildInstance.id,
					playerId: player.id,
					description: guild.guildDescription,
					date: LogsDatabase.getDate()
				});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logPetLoveChange(petEntity: PetEntity, reason: NumberChangeReason): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const logPet = await LogsDatabase.findOrCreatePetEntity(petEntity);
				await LogsPetsLovesChanges.create({
					petId: logPet.id,
					lovePoints: petEntity.lovePoints,
					reason,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logGuildsFoodChanges(guild: Guild, food: number, total: number, reason: NumberChangeReason): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const guildInstance = await LogsDatabase.findOrCreateGuild(guild);
				await LogsGuildsFoodsChanges.create({
					guildId: guildInstance.id,
					food,
					total,
					reason,
					date: LogsDatabase.getDate()
				});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logGuildNewPet(guild: Guild, petEntity: PetEntity): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const petEntityInstance = await LogsDatabase.findOrCreatePetEntity(petEntity);
				const guildInstance = await LogsDatabase.findOrCreateGuild(guild);
				await LogsGuildsNewPets.create({
					guildId: guildInstance.id,
					petId: petEntityInstance.id,
					date: LogsDatabase.getDate()
				});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logPlayerNewPet(discordId: string, petEntity: PetEntity): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const petEntityInstance = await LogsDatabase.findOrCreatePetEntity(petEntity);
				const playerInstance = await LogsDatabase.findOrCreatePlayer(discordId);
				await LogsPlayersNewPets.create({
					playerId: playerInstance.id,
					petId: petEntityInstance.id,
					date: LogsDatabase.getDate()
				});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logsPetSell(soldPet: PetEntity, sellerDiscordId: string, buyerDiscordId: string, price: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				await LogsDatabase.logPetSellTransaction(soldPet, sellerDiscordId, buyerDiscordId, price, transaction);
				await transaction.commit();
				resolve();
			});
		});
	}

	public logGuildElderAdd(guild: Guild, addedPlayerId: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const logGuild = await LogsDatabase.findOrCreateGuild(guild);
				const player = await LogsDatabase.findOrCreatePlayer(addedPlayerId);
				await LogsGuildsEldersAdds.create({
					guildId: logGuild.id,
					addedElder: player.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logGuildLevelUp(guild: Guild): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const guildInstance = await LogsDatabase.findOrCreateGuild(guild);
				await LogsGuildsLevels.create({
					guildId: guildInstance.id,
					level: guild.level,
					date: LogsDatabase.getDate()
				});
				await transaction.commit();
				resolve();
			});
		});
	}

	public async logPlayerDaily(discordId: string, item: GenericItemModel): Promise<void> {
		await this.logItem(discordId, item, LogsPlayersDailies);
	}

	private logPlayerAndNumber(discordId: string, valueFieldName: string, value: number, model: ModelType): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const player = await LogsDatabase.findOrCreatePlayer(discordId);
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
				const player = await LogsDatabase.findOrCreatePlayer(discordId);
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
				const player = await LogsDatabase.findOrCreatePlayer(discordId);
				const [mission] = await LogsMissions.findOrCreate({
					where: {
						name: missionId,
						variant,
						objective
					}
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
				const player = await LogsDatabase.findOrCreatePlayer(discordId);
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

	private logItem(discordId: string, item: GenericItemModel, model: { create: (values?: unknown, options?: CreateOptions<unknown>) => Promise<Model<unknown, unknown>> }): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction: Transaction) => {
				const [player] = await LogsPlayers.findOrCreate({
					where: {
						discordId
					}
				});
				await model.create({
					playerId: player.id,
					itemId: item.id,
					date: LogsDatabase.getDate()
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}
}