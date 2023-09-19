import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {MapLink, MapLinks} from "../../core/database/game/models/MapLink";
import {MapLocations} from "../../core/database/game/models/MapLocation";
import {Maps} from "../../core/maps/Maps";
import {PlayerSmallEvents} from "../../core/database/game/models/PlayerSmallEvent";
import {MissionsController} from "../../core/missions/MissionsController";
import {Constants} from "../../core/Constants";
import {
	getTimeFromXHoursAgo,
	millisecondsToMinutes, millisecondsToSeconds,
	minutesDisplay,
	printTimeBeforeDate
} from "../../core/utils/TimeUtils";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {CommandInteraction, Message, MessageReaction, User} from "discord.js";
import {effectsErrorTextValue} from "../../core/utils/ErrorUtils";
import {RandomUtils} from "../../core/utils/RandomUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {Data} from "../../core/Data";
import {SmallEvent} from "../../core/smallEvents/SmallEvent";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason} from "../../core/constants/LogsConstants";
import {draftBotClient, draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {ReportConstants} from "../../core/constants/ReportConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {format} from "../../core/utils/StringFormatter";
import {TravelTime} from "../../core/maps/TravelTime";
import Player, {Players} from "../../core/database/game/models/Player";
import {Possibility} from "../../core/events/Possibility";
import {BigEventsController} from "../../core/events/BigEventsController";
import {BigEvent} from "../../core/events/BigEvent";
import {applyPossibilityOutcome} from "../../core/events/PossibilityOutcome";
import {FightController} from "../../core/fights/FightController";
import {PlayerFighter} from "../../core/fights/fighter/PlayerFighter";
import {Classes} from "../../core/database/game/models/Class";
import {MonsterFighter} from "../../core/fights/fighter/MonsterFighter";
import {MonsterLocations} from "../../core/database/game/models/MonsterLocation";
import {PVEConstants} from "../../core/constants/PVEConstants";
import {TextInformation} from "../../core/utils/MessageUtils";
import {Guilds} from "../../core/database/game/models/Guild";
import {MapCache} from "../../core/maps/MapCache";
import {FightOvertimeBehavior} from "../../core/fights/FightOvertimeBehavior";
import {GuildConstants} from "../../core/constants/GuildConstants";

/**
 * Initiates a new player on the map
 * @param player
 */
async function initiateNewPlayerOnTheAdventure(player: Player): Promise<void> {
	await Maps.startTravel(player, await MapLinks.getById(Constants.BEGINNING.START_MAP_LINK),
		getTimeFromXHoursAgo(Constants.REPORT.HOURS_USED_TO_CALCULATE_FIRST_REPORT_REWARD).valueOf(),
		NumberChangeReason.NEW_PLAYER);
	await player.save();
}

/* ---------------------------------------------------------------
SMALL EVENTS FUNCTIONS
--------------------------------------------------------------- */

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
 * Executes a small event
 * @param interaction
 * @param language
 * @param player
 * @param forced
 */
async function executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, forced: string): Promise<void> {
	// Pick random event
	let event: string;
	if (forced === null) {
		const keys = Data.getKeys("smallEvents");
		let totalSmallEventsRarity = 0;
		const updatedKeys = [];
		for (const key of keys) {
			const file = await import(`../../core/smallEvents/${key}SmallEvent.js`);
			if (!file.smallEvent?.canBeExecuted) {
				await interaction.editReply({content: `${key} doesn't contain a canBeExecuted function`});
				return;
			}
			if (await file.smallEvent.canBeExecuted(player)) {
				updatedKeys.push(key);
				totalSmallEventsRarity += Data.getModule(`smallEvents.${key}`).getNumber("rarity");
			}
		}
		const randomNb = RandomUtils.randInt(1, totalSmallEventsRarity + 1);
		let sum = 0;
		for (const updatedKey of updatedKeys) {
			sum += Data.getModule(`smallEvents.${updatedKey}`).getNumber("rarity");
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
	const filename = `${event}SmallEvent.js`;
	try {
		const smallEventModule = require.resolve(`../../core/smallEvents/${filename}`);
		try {
			const smallEvent: SmallEvent = require(smallEventModule).smallEvent;

			// Create a template embed
			const seEmbed = new DraftBotEmbed()
				.formatAuthor(Translations.getModule("commands.report", language).get("journal"), interaction.user)
				.setDescription(`${Data.getModule(`smallEvents.${event}`).getString("emote")} `);

			draftBotInstance.logsDatabase.logSmallEvent(player.discordUserId, event).then();
			await smallEvent.executeSmallEvent(interaction, language, player, seEmbed);

			await MissionsController.update(player, interaction.channel, language, {missionId: "doReports"});
		}
		catch (e) {
			console.error(e);
		}
	}
	catch (e) {
		await interaction.editReply({content: `${filename} doesn't exist`});
	}

	// Save
	await PlayerSmallEvents.createPlayerSmallEvent(player.id, event, Date.now()).save();
}

/**
 * Check all missions to check when you execute a big event
 * @param player
 * @param interaction
 * @param language
 */
async function completeMissionsBigEvent(player: Player, interaction: CommandInteraction, language: string): Promise<void> {
	await MissionsController.update(player, interaction.channel, language, {
		missionId: "travelHours", params: {
			travelTime: await player.getCurrentTripDuration()
		}
	});
	const endMapId = (await MapLinks.getById(player.mapLinkId)).endMap;
	await MissionsController.update(player, interaction.channel, language, {
		missionId: "goToPlace",
		params: {mapId: endMapId}
	});
	await MissionsController.update(player, interaction.channel, language, {
		missionId: "exploreDifferentPlaces",
		params: {placeId: endMapId}
	});
	await MissionsController.update(player, interaction.channel, language, {
		missionId: "fromPlaceToPlace",
		params: {mapId: endMapId}
	});
}

/**
 * Send where the player is currently staying on the road
 * @param player
 * @param interaction
 * @param language
 * @param date
 * @param effect
 */
async function sendTravelPath(player: Player, interaction: CommandInteraction, language: string, date: Date, effect: string = null): Promise<void> {
	const travelEmbed = new DraftBotEmbed();
	const tr = Translations.getModule("commands.report", language);
	const timeData = await TravelTime.getTravelData(player, date);
	travelEmbed.formatAuthor(tr.get("travelPathTitle"), interaction.user);
	travelEmbed.setDescription(await Maps.generateTravelPathString(player, language, date, effect));
	travelEmbed.addFields({
		name: tr.get("startPoint"),
		value: (await player.getPreviousMap()).getDisplayName(language),
		inline: true
	});
	travelEmbed.addFields({
		name: tr.get("endPoint"),
		value: (await player.getDestination()).getDisplayName(language),
		inline: true
	});
	if (effect !== null) {
		const errorMessageObject = effectsErrorTextValue(interaction.user, language, player);
		travelEmbed.addFields({
			name: errorMessageObject.title,
			value: errorMessageObject.description,
			inline: false
		});
	}
	else {
		const millisecondsBeforeSmallEvent = timeData.nextSmallEventTime - date.valueOf();
		const millisecondsBeforeBigEvent = timeData.travelEndTime - timeData.travelStartTime - timeData.effectDuration - timeData.playerTravelledTime;
		if (millisecondsBeforeSmallEvent >= millisecondsBeforeBigEvent) {
			// If there is no small event before the big event, do not display anything
			travelEmbed.addFields({
				name: tr.get("travellingTitle"),
				value: tr.get("travellingDescriptionEndTravel")
			});
		}
		else {
			const lastMiniEvent = await PlayerSmallEvents.getLastOfPlayer(player.id);
			const timeBeforeSmallEvent = printTimeBeforeDate(date.valueOf() + millisecondsBeforeSmallEvent);
			travelEmbed.addFields({
				name: tr.get("travellingTitle"),
				value: lastMiniEvent && lastMiniEvent.time > timeData.travelStartTime
					? tr.format("travellingDescription", {
						smallEventEmoji: Data.getModule(`smallEvents.${lastMiniEvent.eventType}`).getString("emote"),
						time: timeBeforeSmallEvent
					})
					: tr.format("travellingDescriptionWithoutSmallEvent", {
						time: timeBeforeSmallEvent
					})
			});
		}
	}

	if (Maps.isOnPveIsland(player) || Maps.isOnBoat(player)) {
		travelEmbed.addFields({
			name: tr.get("remainingEnergyTitle"),
			value: `⚡ ${await player.getCumulativeFightPoint()} / ${await player.getMaxCumulativeFightPoint()}`,
			inline: true
		});
	}
	else {
		travelEmbed.addFields({
			name: tr.get("collectedPointsTitle"),
			value: `🏅 ${await PlayerSmallEvents.calculateCurrentScore(player)}`,
			inline: true
		});
	}

	travelEmbed.addFields({
		name: tr.get("adviceTitle"),
		value: format(Translations.getModule("advices", language).getRandom("advices"), {}),
		inline: true
	});
	await interaction.reply({embeds: [travelEmbed]});
}

const destinationChoiceEmotes = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣"];

/**
 * Creates the description for a chooseDestination embed
 * @param tr
 * @param destinationMaps
 * @param player
 * @param language
 */
async function createDescriptionChooseDestination(
	tr: TranslationModule,
	destinationMaps: number[],
	player: Player,
	language: string
): Promise<string> {
	const isPveMap = MapCache.allPveMapLinks.includes(player.mapLinkId);
	let desc = `${tr.get("chooseDestinationIndications")}\n`;
	for (let i = 0; i < destinationMaps.length; ++i) {
		const map = await MapLocations.getById(destinationMaps[i]);
		const link = await MapLinks.getLinkByLocations(await player.getDestinationId(), destinationMaps[i]);
		const duration = minutesDisplay(link.tripDuration);
		const displayedDuration = isPveMap || RandomUtils.draftbotRandom.bool() ? duration : "?h";
		// We have to convert the duration to hours if it is not unknown
		desc += `${destinationChoiceEmotes[i]} - ${map.getDisplayName(language)} (${displayedDuration})\n`;
	}
	return desc;
}

/**
 * Function called to display the direction chosen by a player
 * @param player
 * @param map
 * @param interaction
 * @param language
 * @returns {Promise<void>}
 */
async function destinationChoseMessage(
	player: Player,
	map: number,
	interaction: CommandInteraction,
	language: string
): Promise<void> {
	const user = interaction.user;
	const channel = interaction.channel;
	const tr = Translations.getModule("commands.report", language);
	const typeTr = Translations.getModule("models.maps", language);
	const mapInstance = await MapLocations.getById(map);
	const destinationEmbed = new DraftBotEmbed();
	destinationEmbed.formatAuthor(tr.get("destinationTitle"), user);
	const tripDuration = await player.getCurrentTripDuration();
	if (tripDuration < 1) {
		destinationEmbed.setDescription(tr.format("choseMapMinutes", {
			mapPrefix: typeTr.get(`types.${mapInstance.type}.prefix`),
			mapName: mapInstance.getDisplayName(language),
			mapType: typeTr.get(`types.${mapInstance.type}.name`).toLowerCase(),
			time: Math.round(tripDuration * 60)
		}));
	}
	else {
		destinationEmbed.setDescription(tr.format("choseMap", {
			mapPrefix: typeTr.get(`types.${mapInstance.type}.prefix`),
			mapName: mapInstance.getDisplayName(language),
			mapType: typeTr.get(`types.${mapInstance.type}.name`).toLowerCase(),
			time: tripDuration
		}));
	}
	await channel.send({embeds: [destinationEmbed]});
}

/**
 * Sends a message so that the player can choose where to go
 * @param player
 * @param interaction
 * @param language
 * @param forcedLink Forced map link to go to
 * @param reason
 */
async function chooseDestination(
	player: Player,
	interaction: CommandInteraction,
	language: string,
	forcedLink: MapLink,
	reason: NumberChangeReason
): Promise<void> {
	await PlayerSmallEvents.removeSmallEventsOfPlayer(player.id);
	const destinationMaps = await Maps.getNextPlayerAvailableMaps(player);

	if (destinationMaps.length === 0) {
		console.log(`${interaction.user} hasn't any destination map (current map: ${await player.getDestinationId()})`);
		return;
	}

	if ((!Maps.isOnPveIsland(player) || destinationMaps.length === 1) &&
		(forcedLink || destinationMaps.length === 1 || RandomUtils.draftbotRandom.bool(1, 3) && player.mapLinkId !== Constants.BEGINNING.LAST_MAP_LINK)
	) {
		const newLink = forcedLink ?? await MapLinks.getLinkByLocations(await player.getDestinationId(), destinationMaps[0]);
		await Maps.startTravel(player, newLink, Date.now(), reason);
		await destinationChoseMessage(player, newLink.endMap, interaction, language);
		return;
	}

	const tr = Translations.getModule("commands.report", language);
	const chooseDestinationEmbed = new DraftBotEmbed();
	chooseDestinationEmbed.formatAuthor(tr.get("destinationTitle"), interaction.user);
	chooseDestinationEmbed.setDescription(await createDescriptionChooseDestination(tr, destinationMaps, player, language));

	const sentMessage = await interaction.channel.send({embeds: [chooseDestinationEmbed]});

	const collector = sentMessage.createReactionCollector({
		filter: (reaction, user) => destinationChoiceEmotes.indexOf(reaction.emoji.name) !== -1 && user.id === interaction.user.id,
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.CHOOSE_DESTINATION, collector);

	collector.on("collect", () => {
		collector.stop();
	});

	collector.on("end", async (collected) => {
		const mapId = collected.first() ? destinationMaps[destinationChoiceEmotes.indexOf(collected.first().emoji.name)] : destinationMaps[RandomUtils.randInt(0, destinationMaps.length)];
		const newLink = await MapLinks.getLinkByLocations(await player.getDestinationId(), mapId);
		await Maps.startTravel(player, newLink, Date.now(), reason);
		await destinationChoseMessage(player, mapId, interaction, language);
		BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.CHOOSE_DESTINATION);
	});

	for (let i = 0; i < destinationMaps.length; ++i) {
		try {
			await sentMessage.react(destinationChoiceEmotes[i]);
		}
		catch (e) {
			console.error(e);
		}
	}
}

/**
 * @param textInformation
 * @param {BigEvent} event
 * @param {Possibility} possibility
 * @param {Player} player
 * @param {Number} time
 * @return {Promise<CommandInteraction>}
 */
async function doPossibility(
	textInformation: TextInformation,
	event: BigEvent,
	possibility: Possibility,
	player: Player,
	time: number
): Promise<Message> {
	[player] = await Players.getOrRegister(player.discordUserId);
	player.nextEvent = null;
	textInformation.tr = Translations.getModule("commands.report", textInformation.language);

	if (event.id === 0 && possibility.emoji === "end") { // Don't do anything if the player ends the first report
		draftBotInstance.logsDatabase.logBigEvent(player.discordUserId, event.id, possibility.emoji, 0).then();
		const msg = await textInformation.interaction.channel.send({
			content: textInformation.tr.format("doPossibility", {
				pseudo: textInformation.interaction.user,
				result: "",
				event: format(possibility.getText(textInformation.language), {}),
				emoji: "",
				alte: ""
			})
		});
		BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.REPORT);
		return msg;
	}

	const randomOutcomeIndex = RandomUtils.randInt(0, possibility.outcomes.length);
	const randomOutcome = possibility.outcomes[randomOutcomeIndex];

	draftBotInstance.logsDatabase.logBigEvent(player.discordUserId, event.id, possibility.emoji, randomOutcomeIndex).then();

	const outcomeResult = await applyPossibilityOutcome(randomOutcome, textInformation, player, time);

	const outcomeMsg = await textInformation.interaction.channel.send({
		content: textInformation.tr.format("doPossibility", {
			pseudo: textInformation.interaction.user,
			result: outcomeResult.description,
			event: format(randomOutcome.translations[textInformation.language], {}),
			emoji: possibility.emoji === "end" ? "" : `${possibility.emoji} `,
			alte: outcomeResult.alterationEmoji
		})
	});

	if (!await player.killIfNeeded(textInformation.interaction.channel, textInformation.language, NumberChangeReason.BIG_EVENT)) {
		await chooseDestination(player, textInformation.interaction, textInformation.language, outcomeResult.forcedDestination, NumberChangeReason.BIG_EVENT);
	}

	await MissionsController.update(player, textInformation.interaction.channel, textInformation.language, {missionId: "doReports"});

	const tagsToVerify = (randomOutcome.tags ?? [])
		.concat(possibility.tags ?? [])
		.concat(event.tags ?? []);
	if (tagsToVerify) {
		for (const tag of tagsToVerify) {
			await MissionsController.update(player, textInformation.interaction.channel, textInformation.language, {
				missionId: tag,
				params: {tags: tagsToVerify}
			});
		}
	}

	await player.save();
	BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.REPORT);
	return outcomeMsg;
}

/**
 * @param textInformation
 * @param {BigEvent} event
 * @param {Player} player
 * @param {Number} time
 * @return {Promise<void>}
 */
async function doEvent(textInformation: TextInformation, event: BigEvent, player: Player, time: number): Promise<void> {
	const reactionsAndText = await event.getReactionsAndText(player, textInformation.language);
	const eventDisplayed = await textInformation.interaction.editReply({
		content: Translations.getModule("commands.report", textInformation.language).format("doEvent", {
			pseudo: textInformation.interaction.user,
			event: reactionsAndText.text
		})
	}) as Message;
	const collector = eventDisplayed.createReactionCollector({
		filter: (reaction, user) => reactionsAndText.reactions.indexOf(reaction.emoji.name) !== -1 && user.id === textInformation.interaction.user.id,
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.REPORT, collector);

	collector.on("collect", async (reaction) => {
		collector.stop();
		if (reaction.emoji.name === Constants.REACTIONS.NOT_REPLIED_REACTION) {
			return;
		}

		await doPossibility(textInformation, event, event.getPossibilityWithReaction(reaction.emoji.name), player, time);
	});

	collector.on("end", async (collected) => {
		if (!collected.first() || collected.firstKey() === Constants.REACTIONS.NOT_REPLIED_REACTION) {
			await doPossibility(textInformation, event, event.getPossibilityWithReaction("end"), player, time);
		}
	});
	for (const reaction of reactionsAndText.reactions) {
		if (reaction !== "end" && reaction !== Constants.REACTIONS.NOT_REPLIED_REACTION) {
			await eventDisplayed.react(reaction)
				.catch();
		}
	}
}

/**
 * Do a random big event
 * @param interaction
 * @param language
 * @param player
 * @param forceSpecificEvent
 */
async function doRandomBigEvent(
	interaction: CommandInteraction,
	language: string,
	player: Player,
	forceSpecificEvent: number
): Promise<void> {
	await completeMissionsBigEvent(player, interaction, language);
	const travelData = await TravelTime.getTravelDataSimplified(player, new Date());
	let time = forceSpecificEvent
		? ReportConstants.TIME_MAXIMAL + 1
		: millisecondsToMinutes(travelData.playerTravelledTime);
	if (time > ReportConstants.TIME_LIMIT) {
		time = ReportConstants.TIME_LIMIT;
	}

	let event;

	// NextEvent is defined ?
	if (player.nextEvent) {
		forceSpecificEvent = player.nextEvent;
	}

	if (forceSpecificEvent === -1 || !forceSpecificEvent) {
		const mapId = await player.getDestinationId();
		event = await BigEventsController.getRandomEvent(mapId, player);
		if (!event) {
			await interaction.channel.send({content: "It seems that there is no event here... It's a bug, please report it to the DraftBot staff."});
			return;
		}
	}
	else {
		event = BigEventsController.getEvent(forceSpecificEvent);
	}
	await Maps.stopTravel(player);
	await doEvent({interaction, language}, event, player, time);
}

/**
 * Do a PVE boss fight
 * @param interaction
 * @param language
 * @param player
 */
async function doPVEBoss(
	interaction: CommandInteraction,
	language: string,
	player: Player
): Promise<void> {
	const seed = player.experience + millisecondsToSeconds(player.startTravelDate.valueOf());
	const monsterObj = await MonsterLocations.getRandomMonster((await player.getDestination()).id, seed);
	const tr = Translations.getModule("commands.report", language);
	const randomLevel = player.level - PVEConstants.MONSTER_LEVEL_RANDOM_RANGE / 2 + seed % PVEConstants.MONSTER_LEVEL_RANDOM_RANGE;
	const fightCallback = async (fight: FightController): Promise<void> => {
		if (fight) {
			const rewards = monsterObj.monster.getRewards(randomLevel);
			let desc = tr.format("monsterRewardsDescription", {
				money: rewards.money,
				experience: rewards.xp
			});

			player.fightPointsLost = fight.fightInitiator.getMaxFightPoints() - fight.fightInitiator.getFightPoints();

			// Only give reward if draw or win
			if (fight.fighters[fight.getWinner()] instanceof PlayerFighter) {
				const fightView = fight.getFightView();
				await player.addMoney({
					amount: rewards.money,
					channel: fightView.channel,
					language: fightView.language,
					reason: NumberChangeReason.PVE_FIGHT
				});
				await player.addExperience({
					amount: rewards.xp,
					channel: fightView.channel,
					language: fightView.language,
					reason: NumberChangeReason.PVE_FIGHT
				});
				if (player.guildId) {
					const guild = await Guilds.getById(player.guildId);
					guild.addScore(rewards.guildScore, NumberChangeReason.PVE_FIGHT);
					await guild.addExperience(rewards.guildXp, fightView.channel, fightView.language, NumberChangeReason.PVE_FIGHT);
					await guild.save();
					if (guild.level < GuildConstants.MAX_LEVEL) {
						desc += tr.format("monsterRewardGuildXp", {
							guildXp: rewards.guildXp
						});
					}
					desc += tr.format("monsterRewardsGuildPoints", {
						guildPoints: rewards.guildScore
					});
				}
				await fightView.channel.send({
					embeds: [
						new DraftBotEmbed()
							.formatAuthor(tr.get("monsterRewardsTitle"), interaction.user)
							.setDescription(desc)
					]
				});
			}

			await player.save();

			draftBotInstance.logsDatabase.logPveFight(fight).then();
		}

		if (!await player.leavePVEIslandIfNoFightPoints(interaction, language)) {
			await Maps.stopTravel(player);
			await player.setLastReportWithEffect(
				0,
				EffectsConstants.EMOJI_TEXT.SMILEY
			);
			await chooseDestination(player, interaction, language, null, NumberChangeReason.BIG_EVENT);
		}
	};

	if (!monsterObj) {
		await interaction.editReply("There is no monster here... This is a bug, please report this bug to the draftbot's team");
		await fightCallback(null);
		return;
	}

	const monsterFighter = new MonsterFighter(
		randomLevel,
		monsterObj.monster,
		monsterObj.attacks,
		language
	);

	const msg = await interaction.editReply({
		content:
			tr.format("pveEvent", {
				pseudo: player.getMention(),
				startTheFightReaction: Constants.REACTIONS.START_FIGHT_REACTION,
				waitABitReaction: Constants.REACTIONS.WAIT_A_BIT_REACTION,
				event: `${tr.getRandom("encounterMonster")}`,
				monsterDisplay: tr.format("encounterMonsterStats", {
					monsterName: monsterFighter.getName(),
					emoji: monsterFighter.getEmoji(),
					description: monsterFighter.getDescription(),
					level: monsterFighter.level,
					fightPoints: monsterFighter.getFightPoints(),
					attack: monsterFighter.getAttack(),
					defense: monsterFighter.getDefense(),
					speed: monsterFighter.getSpeed()
				})
			})
	});
	const collector = msg.createReactionCollector({
		filter: (reaction: MessageReaction, user: User) =>
			user.id === player.discordUserId &&
			reaction.users.cache.has(draftBotClient.user.id) || reaction.emoji.name === Constants.REACTIONS.NOT_REPLIED_REACTION,
		time: PVEConstants.COLLECTOR_TIME,
		max: 1
	});
	BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.START_BOSS_FIGHT, collector);
	collector.on("end", async (reaction) => {
		if (!reaction.first() || [Constants.REACTIONS.WAIT_A_BIT_REACTION, Constants.REACTIONS.NOT_REPLIED_REACTION].includes(reaction.first().emoji.name)) {
			await interaction.channel.send(tr.format("noFight", {
				pseudo: player.getMention(),
				waitABitReaction: Constants.REACTIONS.WAIT_A_BIT_REACTION
			}));
			BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.START_BOSS_FIGHT);
			return;
		}

		const playerFighter = new PlayerFighter(interaction.user, player, await Classes.getById(player.class));
		await playerFighter.loadStats(true);
		playerFighter.setBaseFightPoints(playerFighter.getMaxFightPoints() - player.fightPointsLost);

		const fight = new FightController(
			{fighter1: playerFighter, fighter2: monsterFighter},
			{friendly: false, overtimeBehavior: FightOvertimeBehavior.INCREASE_DAMAGE_PVE},
			interaction.channel,
			language
		);
		fight.setEndCallback(() => fightCallback(fight));
		BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.START_BOSS_FIGHT);
		await fight.startFight();
	});
	await msg.react(Constants.REACTIONS.START_FIGHT_REACTION);
	await msg.react(Constants.REACTIONS.WAIT_A_BIT_REACTION);
}

/**
 * The main command of the bot : makes the player progress in the adventure
 * @param interaction
 * @param language
 * @param player
 * @param forceSpecificEvent
 * @param forceSmallEvent
 */
async function executeCommand(
	interaction: CommandInteraction,
	language: string,
	player: Player,
	forceSpecificEvent: number = null,
	forceSmallEvent: string = null
): Promise<void> {
	if (player.score === 0 && player.effect === EffectsConstants.EMOJI_TEXT.BABY) {
		await initiateNewPlayerOnTheAdventure(player);
	}

	if (await sendBlockedError(interaction, language)) {
		return;
	}

	BlockingUtils.blockPlayer(player.discordUserId, BlockingConstants.REASONS.REPORT_COMMAND, Constants.MESSAGES.COLLECTOR_TIME * 3); // MaxTime here is to prevent any accident permanent blocking

	await MissionsController.update(player, interaction.channel, language, {missionId: "commandReport"});

	const currentDate = new Date();

	if (player.effect !== EffectsConstants.EMOJI_TEXT.SMILEY && player.currentEffectFinished(currentDate)) {
		await MissionsController.update(player, interaction.channel, language, {missionId: "recoverAlteration"});
	}

	if (forceSpecificEvent || await Maps.isArrived(player, currentDate)) {
		await interaction.deferReply();
		if (Maps.isOnPveIsland(player)) {
			await doPVEBoss(interaction, language, player);
		}
		else {
			await doRandomBigEvent(interaction, language, player, forceSpecificEvent);
		}
		BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.REPORT_COMMAND);
		return;
	}

	if (forceSmallEvent || await needSmallEvent(player, currentDate)) {
		await interaction.deferReply();
		await executeSmallEvent(interaction, language, player, forceSmallEvent);
		BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.REPORT_COMMAND);
		return;
	}

	if (!player.currentEffectFinished(currentDate)) {
		await sendTravelPath(player, interaction, language, currentDate, player.effect);
		BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.REPORT_COMMAND);
		return;
	}

	if (player.mapLinkId === null) {
		await Maps.startTravel(player, await MapLinks.getRandomLink(), Date.now(), NumberChangeReason.DEBUG);
		BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.REPORT_COMMAND);
		return;
	}

	if (!Maps.isTravelling(player)) {
		await chooseDestination(player, interaction, language, null, NumberChangeReason.PVE_FIGHT);
		BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.REPORT_COMMAND);
		return;
	}

	await sendTravelPath(player, interaction, language, currentDate, null);
	BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.REPORT_COMMAND);
}

const currentCommandFrenchTranslations = Translations.getModule("commands.report", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.report", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};