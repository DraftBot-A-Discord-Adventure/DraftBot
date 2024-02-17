import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";
import {
	CommandReportChooseDestinationRes,
	CommandReportErrorNoMonsterRes,
	CommandReportMonsterRewardRes,
	CommandReportPacketReq,
	CommandReportRefusePveFightRes, CommandReportTravelSummaryRes
} from "../../../../Lib/src/packets/commands/CommandReportPacket";
import {Player, Players} from "../../core/database/game/models/Player";
import {EffectsConstants} from "../../../../Lib/src/constants/EffectsConstants";
import {Maps} from "../../core/maps/Maps";
import {MapLink, MapLinkDataController} from "../../data/MapLink";
import {Constants} from "../../core/Constants";
import {getTimeFromXHoursAgo, millisecondsToSeconds} from "../../../../Lib/src/utils/TimeUtils";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {MissionsController} from "../../core/missions/MissionsController";
import {FightController} from "../../core/fights/FightController";
import {PVEConstants} from "../../core/constants/PVEConstants";
import {MonsterDataController} from "../../data/Monster";
import {PlayerFighter} from "../../core/fights/fighter/PlayerFighter";
import {NumberChangeReason} from "../../core/constants/LogsConstants";
import {Guilds} from "../../core/database/game/models/Guild";
import {GuildConstants} from "../../core/constants/GuildConstants";
import {draftBotInstance} from "../../index";
import {MonsterFighter} from "../../core/fights/fighter/MonsterFighter";
import {EndCallback, ReactionCollectorInstance} from "../../core/utils/ReactionsCollector";
import {FightOvertimeBehavior} from "../../core/fights/FightOvertimeBehavior";
import {ClassDataController} from "../../data/Class";
import {PlayerSmallEvents} from "../../core/database/game/models/PlayerSmallEvent";
import {RandomUtils} from "../../core/utils/RandomUtils";
import {ReactionCollectorPveFight, ReactionCollectorPveFightReactionValidate} from "../../../../Lib/src/packets/interaction/ReactionCollectorPveFight";
import {ReactionCollectorChooseDestination, ReactionCollectorChooseDestinationReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorChooseDestination";
import {MapCache} from "../../core/maps/MapCache";
import {TravelTime} from "../../core/maps/TravelTime";
import {SmallEventDataController, SmallEventFuncs} from "../../data/SmallEvent";

export default class ReportCommand {
	@packetHandler(CommandReportPacketReq)
	async execute(
		client: WebsocketClient,
		packet: CommandReportPacketReq,
		context: PacketContext,
		response: DraftBotPacket[],
		forceSpecificEvent: number = null,
		forceSmallEvent: string = null
	): Promise<void> {
		const player = await Players.getByKeycloakId(packet.keycloakId);
		if (player.score === 0 && player.effect === EffectsConstants.EMOJI_TEXT.BABY) {
			await initiateNewPlayerOnTheAdventure(player);
		}

		if (BlockingUtils.appendBlockedPacket(player, response)) {
			return;
		}

		BlockingUtils.blockPlayer(player.id, BlockingConstants.REASONS.REPORT_COMMAND, Constants.MESSAGES.COLLECTOR_TIME * 3); // MaxTime here is to prevent any accident permanent blocking

		await MissionsController.update(player, response, {missionId: "commandReport"});

		const currentDate = new Date();

		if (player.effect !== EffectsConstants.EMOJI_TEXT.SMILEY && player.currentEffectFinished(currentDate)) {
			await MissionsController.update(player, response, {missionId: "recoverAlteration"});
		}

		if (forceSpecificEvent || Maps.isArrived(player, currentDate)) {
			if (Maps.isOnPveIsland(player)) {
				await doPVEBoss(player, response, context);
			}
			else {
				await doRandomBigEvent(interaction, language, player, forceSpecificEvent);
			}
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.REPORT_COMMAND);
			return;
		}

		if (forceSmallEvent || await needSmallEvent(player, currentDate)) {
			await executeSmallEvent(player, response, forceSmallEvent);
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.REPORT_COMMAND);
			return;
		}

		if (!player.currentEffectFinished(currentDate)) {
			await sendTravelPath(player, response, currentDate, player.effect);
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.REPORT_COMMAND);
			return;
		}

		if (player.mapLinkId === null) {
			await Maps.startTravel(player, MapLinkDataController.instance.getRandomLink(), Date.now());
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.REPORT_COMMAND);
			return;
		}

		if (!Maps.isTravelling(player)) {
			await chooseDestination(context, player, null, response);
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.REPORT_COMMAND);
			return;
		}

		await sendTravelPath(player, response, currentDate, null);
		BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.REPORT_COMMAND);
	}
}

/**
 * Initiates a new player on the map
 * @param player
 */
async function initiateNewPlayerOnTheAdventure(player: Player): Promise<void> {
	await Maps.startTravel(player, MapLinkDataController.instance.getById(Constants.BEGINNING.START_MAP_LINK),
		getTimeFromXHoursAgo(Constants.REPORT.HOURS_USED_TO_CALCULATE_FIRST_REPORT_REWARD).valueOf());
	await player.save();
}

/**
 * Automatically chooses a destination at random / based on the forced link
 * @param forcedLink
 * @param player
 * @param destinationMaps
 * @param response
 */
async function automaticChooseDestination(forcedLink: MapLink, player: Player, destinationMaps: number[], response: DraftBotPacket[]): Promise<void> {
	const newLink = forcedLink && forcedLink.id !== -1 ? forcedLink : MapLinkDataController.instance.getLinkByLocations(player.getDestinationId(), destinationMaps[0]);
	await Maps.startTravel(player, newLink, Date.now());
	response.push(makePacket(CommandReportChooseDestinationRes, {
		mapId: newLink.endMap,
		tripDuration: newLink.tripDuration
	}));
}

/**
 * Sends a message so that the player can choose where to go
 * @param context
 * @param player
 * @param forcedLink Forced map link to go to
 * @param response
 */
async function chooseDestination(
	context: PacketContext,
	player: Player,
	forcedLink: MapLink,
	response: DraftBotPacket[]
): Promise<void> {
	await PlayerSmallEvents.removeSmallEventsOfPlayer(player.id);
	const destinationMaps = Maps.getNextPlayerAvailableMaps(player);

	if (destinationMaps.length === 0) {
		console.log(`${player.id} hasn't any destination map (current map: ${player.getDestinationId()})`);
		return;
	}

	if ((!Maps.isOnPveIsland(player) || destinationMaps.length === 1) &&
		(forcedLink || destinationMaps.length === 1 || RandomUtils.draftbotRandom.bool(Constants.REPORT.AUTO_CHOOSE_DESTINATION_CHANCE) && player.mapLinkId !== Constants.BEGINNING.LAST_MAP_LINK)
	) {
		await automaticChooseDestination(forcedLink, player, destinationMaps, response);
		return;
	}

	const mapReactions: ReactionCollectorChooseDestinationReaction[] = destinationMaps.map((mapId) => {
		const mapLink = MapLinkDataController.instance.getLinkByLocations(player.getDestinationId(), mapId);
		const isPveMap = MapCache.allPveMapLinks.includes(mapLink.id);

		return { mapId, tripDuration: isPveMap || RandomUtils.draftbotRandom.bool() ? mapLink.tripDuration : null };
	});

	const collector = new ReactionCollectorChooseDestination(mapReactions);

	const endCallback: EndCallback = async (collector, response) => {
		const firstReaction = collector.getFirstReaction();
		const mapId = firstReaction ?
			(firstReaction.reaction as ReactionCollectorChooseDestinationReaction).mapId :
			(RandomUtils.draftbotRandom.pick(collector.creationPacket.reactions).data as ReactionCollectorChooseDestinationReaction).mapId;
		const newLink = MapLinkDataController.instance.getLinkByLocations(player.getDestinationId(), mapId);
		await Maps.startTravel(player, newLink, Date.now());
		response.push(makePacket(CommandReportChooseDestinationRes, {
			mapId: newLink.endMap,
			tripDuration: newLink.tripDuration
		}));
		BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.CHOOSE_DESTINATION);
	};

	const packet = new ReactionCollectorInstance(
		collector,
		context,
		{
			allowedPlayerIds: [player.id],
			time: Constants.MESSAGES.COLLECTOR_TIME,
			reactionLimit: 1
		},
		endCallback
	)
		.block(player.id, BlockingConstants.REASONS.CHOOSE_DESTINATION)
		.build();

	response.push(packet);
}

/**
 * Returns if the player reached a stopping point (= small event)
 * @param {Player} player
 * @param date
 * @returns {boolean}
 */
async function needSmallEvent(player: Player, date: Date): Promise<boolean> {
	return (await TravelTime.getTravelData(player, date)).nextSmallEventTime <= date.valueOf();
}

/**
 * Send where the player is currently staying on the road
 * @param player
 * @param response
 * @param date
 * @param effect
 */
async function sendTravelPath(player: Player, response: DraftBotPacket[], date: Date, effect: string = null): Promise<void> {
	const timeData = await TravelTime.getTravelData(player, date);
	const showEnergy = Maps.isOnPveIsland(player) || Maps.isOnBoat(player);
	const lastMiniEvent = await PlayerSmallEvents.getLastOfPlayer(player.id);
	response.push(makePacket(CommandReportTravelSummaryRes, {
		effect,
		arriveTime: timeData.travelEndTime,
		effectEndTime: effect ? timeData.effectEndTime : null,
		points: {
			show: !showEnergy,
			cumulated: !showEnergy ? await PlayerSmallEvents.calculateCurrentScore(player) : 0
		},
		energy: {
			show: showEnergy,
			current: showEnergy ? player.getCumulativeFightPoint() : 0,
			max: showEnergy ? player.getMaxCumulativeFightPoint() : 0
		},
		endMap: player.getDestinationId(),
		nextStopTime: timeData.nextSmallEventTime,
		lastSmallEventId: lastMiniEvent ? lastMiniEvent.eventType : null,
		startMap: player.getPreviousMapId()
	}));
}

/**
 * Do a PVE boss fight
 * @param player
 * @param response
 * @param context
 */
async function doPVEBoss(
	player: Player,
	response: DraftBotPacket[],
	context: PacketContext
): Promise<void> {
	const seed = player.id + millisecondsToSeconds(player.startTravelDate.valueOf());
	const monsterObj = MonsterDataController.instance.getRandomMonster(player.getDestination().id, seed);
	const randomLevel = player.level - PVEConstants.MONSTER_LEVEL_RANDOM_RANGE / 2 + seed % PVEConstants.MONSTER_LEVEL_RANDOM_RANGE;
	const fightCallback = async (fight: FightController): Promise<void> => {
		if (fight) {
			const rewards = monsterObj.getRewards(randomLevel);
			let guildXp: number = 0;
			let guildPoints: number = 0;

			player.fightPointsLost = fight.fightInitiator.getMaxFightPoints() - fight.fightInitiator.getFightPoints();

			// Only give reward if draw or win
			if (fight.fighters[fight.getWinner()] instanceof PlayerFighter) {
				await player.addMoney({
					amount: rewards.money,
					reason: NumberChangeReason.PVE_FIGHT,
					response
				});
				await player.addExperience({
					amount: rewards.xp,
					reason: NumberChangeReason.PVE_FIGHT,
					response
				});
				if (player.guildId) {
					const guild = await Guilds.getById(player.guildId);
					await guild.addScore(rewards.guildScore, response, NumberChangeReason.PVE_FIGHT);
					await guild.addExperience(rewards.guildXp, response, NumberChangeReason.PVE_FIGHT);
					await guild.save();
					if (guild.level < GuildConstants.MAX_LEVEL) {
						guildXp = rewards.guildXp;
					}
					guildPoints = rewards.guildScore;
				}
				response.push(makePacket(CommandReportMonsterRewardRes, {
					money: rewards.money,
					experience: rewards.xp,
					guildXp,
					guildPoints
				}));
				await MissionsController.update(player, response, { missionId: "winBoss" });
			}

			await player.save();

			draftBotInstance.logsDatabase.logPveFight(fight).then();
		}

		if (!await player.leavePVEIslandIfNoFightPoints(response)) {
			await Maps.stopTravel(player);
			await player.setLastReportWithEffect(
				0,
				EffectsConstants.EMOJI_TEXT.SMILEY,
				NumberChangeReason.BIG_EVENT
			);
			await chooseDestination(player, interaction, language, null);
		}
	};

	if (!monsterObj) {
		response.push(makePacket(CommandReportErrorNoMonsterRes, {}));
		await fightCallback(null);
		return;
	}

	const monsterFighter = new MonsterFighter(
		randomLevel,
		monsterObj
	);

	const reactionCollector = new ReactionCollectorPveFight({
		monster: {
			id: monsterObj.id,
			level: randomLevel,
			attack: monsterFighter.getAttack(),
			defense: monsterFighter.getDefense(),
			speed: monsterFighter.getSpeed(),
			fightPoints: monsterFighter.getFightPoints()
		}
	});

	const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]) => {
		const firstReaction = collector.getFirstReaction();

		if (!firstReaction || !(firstReaction instanceof ReactionCollectorPveFightReactionValidate)) {
			response.push(makePacket(CommandReportRefusePveFightRes, {}));
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.START_BOSS_FIGHT);
			return;
		}

		const playerFighter = new PlayerFighter(player, ClassDataController.instance.getById(player.class));
		await playerFighter.loadStats(true);
		playerFighter.setBaseFightPoints(playerFighter.getMaxFightPoints() - player.fightPointsLost);

		const fight = new FightController(
			{
				fighter1: playerFighter,
				fighter2: monsterFighter
			},
			{
				friendly: false,
				overtimeBehavior: FightOvertimeBehavior.INCREASE_DAMAGE_PVE
			},
			context
		);
		fight.setEndCallback(() => fightCallback(fight));
		BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.START_BOSS_FIGHT);
		await fight.startFight();
	};

	const packet = new ReactionCollectorInstance(
		reactionCollector,
		context,
		{
			allowedPlayerIds: [player.id],
			time: PVEConstants.COLLECTOR_TIME
		},
		endCallback
	)
		.block(player.id, BlockingConstants.REASONS.START_BOSS_FIGHT)
		.build();

	response.push(packet);
}

/**
 * Executes a small event
 * @param player
 * @param response
 * @param forced
 */
async function executeSmallEvent(player: Player, response:DraftBotPacket[], forced: string): Promise<void> {
	// Pick random event
	let event: string;
	if (forced === null) {
		const keys = SmallEventDataController.instance.getKeys();
		let totalSmallEventsRarity = 0;
		const updatedKeys = [];
		for (const key of keys) {
			const file = await import(`../../core/smallEvents/${key}.js`);
			if (!file.smallEvent?.canBeExecuted) {
				console.error(`${key} doesn't contain a canBeExecuted function`);
				return;
			}
			if (await file.smallEvent.canBeExecuted(player)) {
				updatedKeys.push(key);
				totalSmallEventsRarity += SmallEventDataController.instance.getById(key).rarity;
			}
		}
		const randomNb = RandomUtils.randInt(1, totalSmallEventsRarity + 1);
		let sum = 0;
		for (const updatedKey of updatedKeys) {
			sum += SmallEventDataController.instance.getById(updatedKey).rarity;
			if (sum >= randomNb) {
				event = updatedKey;
				break;
			}
		}
	}
	else {
		event = forced;
	}

	// Execute the event
	const filename = `${event}.js`;
	try {
		const smallEventModule = require.resolve(`../../core/smallEvents/${filename}`);
		try {
			const smallEvent: SmallEventFuncs = require(smallEventModule).smallEventFuncs;
			draftBotInstance.logsDatabase.logSmallEvent(player.keycloakId, event).then();
			await smallEvent.executeSmallEvent(response, player);
			await MissionsController.update(player, response, { missionId: "doReports" });
		}
		catch (e) {
			console.error(e);
		}
	}
	catch (e) {
		console.error(`${filename} doesn't exist`);
	}

	// Save
	await PlayerSmallEvents.createPlayerSmallEvent(player.id, event, Date.now()).save();
}