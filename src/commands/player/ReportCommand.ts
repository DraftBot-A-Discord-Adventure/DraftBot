import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import BigEvent, {BigEvents} from "../../core/database/game/models/BigEvent";
import {MapLinks} from "../../core/database/game/models/MapLink";
import {MapLocations} from "../../core/database/game/models/MapLocation";
import {Maps} from "../../core/maps/Maps";
import {PlayerSmallEvents} from "../../core/database/game/models/PlayerSmallEvent";
import Possibility from "../../core/database/game/models/Possibility";
import {MissionsController} from "../../core/missions/MissionsController";
import {Constants} from "../../core/Constants";
import {millisecondsToMinutes, minutesDisplay, minutesToHours, parseTimeDifference} from "../../core/utils/TimeUtils";
import {Tags} from "../../core/database/game/models/Tag";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {CommandInteraction, Message} from "discord.js";
import {effectsErrorTextValue} from "../../core/utils/ErrorUtils";
import {RandomUtils} from "../../core/utils/RandomUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {Data} from "../../core/Data";
import {SmallEvent} from "../../core/smallEvents/SmallEvent";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {giveRandomItem} from "../../core/utils/ItemUtils";
import {NumberChangeReason} from "../../core/constants/LogsConstants";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {ReportConstants} from "../../core/constants/ReportConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {format} from "../../core/utils/StringFormatter";
import {TravelTime} from "../../core/maps/TravelTime";
import Player, {Players} from "../../core/database/game/models/Player";

type TextInformation = { interaction: CommandInteraction, language: string, tr?: TranslationModule }

/**
 * Initiates a new player on the map
 * @param player
 */
async function initiateNewPlayerOnTheAdventure(player: Player): Promise<void> {
	await Maps.startTravel(player, await MapLinks.getById(Constants.BEGINNING.START_MAP_LINK), Date.now(), NumberChangeReason.NEW_PLAYER);
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
		for (let i = 0; i < keys.length; ++i) {
			const file = await import(`../../core/smallEvents/${keys[i]}SmallEvent.js`);
			if (!file.smallEvent || !file.smallEvent.canBeExecuted) {
				await interaction.editReply({content: `${keys[i]} doesn't contain a canBeExecuted function`});
				return;
			}
			if (await file.smallEvent.canBeExecuted(player)) {
				updatedKeys.push(keys[i]);
				totalSmallEventsRarity += Data.getModule(`smallEvents.${keys[i]}`).getNumber("rarity");
			}
		}
		const randomNb = RandomUtils.randInt(1, totalSmallEventsRarity + 1);
		let sum = 0;
		for (let i = 0; i < updatedKeys.length; ++i) {
			sum += Data.getModule(`smallEvents.${updatedKeys[i]}`).getNumber("rarity");
			if (sum >= randomNb) {
				event = updatedKeys[i];
				break;
			}
		}
	}
	else {
		event = forced;
	}

	// Execute the event
	const filename = event + "SmallEvent.js";
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
 * If the player reached his destination (= big event)
 * @param {Player} player
 * @param date
 * @returns {boolean}
 */
async function needBigEvent(player: Player, date: Date): Promise<boolean> {
	return await Maps.isArrived(player, date);
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
			// if there is no small event before the big event, do not display anything
			travelEmbed.addFields({
				name: tr.get("travellingTitle"),
				value: tr.get("travellingDescriptionEndTravel")
			});
		}
		else {
			const lastMiniEvent = await PlayerSmallEvents.getLastOfPlayer(player.id);
			const timeBeforeSmallEvent = parseTimeDifference(date.valueOf() + millisecondsBeforeSmallEvent, date.valueOf(), language);
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

	travelEmbed.addFields({
		name: tr.get("collectedPointsTitle"),
		value: `🏅 ${await PlayerSmallEvents.calculateCurrentScore(player)}`,
		inline: true
	});

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
	let desc = tr.get("chooseDestinationIndications") + "\n";
	for (let i = 0; i < destinationMaps.length; ++i) {
		const map = await MapLocations.getById(destinationMaps[i]);
		const link = await MapLinks.getLinkByLocations(await player.getDestinationId(), destinationMaps[i]);
		const duration = minutesToHours(link.tripDuration);
		const displayedDuration = RandomUtils.draftbotRandom.bool() ? duration : "?";
		// we have to convert the duration to hours if it is not unknown
		desc += `${destinationChoiceEmotes[i]} - ${map.getDisplayName(language)} (${displayedDuration}h)\n`;
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
 * @param restrictedMapType
 */
async function chooseDestination(
	player: Player,
	interaction: CommandInteraction,
	language: string,
	restrictedMapType: string
): Promise<void> {
	await PlayerSmallEvents.removeSmallEventsOfPlayer(player.id);
	const destinationMaps = await Maps.getNextPlayerAvailableMaps(player, restrictedMapType);

	if (destinationMaps.length === 0) {
		console.log(`${interaction.user} hasn't any destination map (current map: ${await player.getDestinationId()}, restrictedMapType: ${restrictedMapType})`);
		return;
	}

	if (destinationMaps.length === 1 || RandomUtils.draftbotRandom.bool(1, 3) && player.mapLinkId !== Constants.BEGINNING.LAST_MAP_LINK) {
		const newLink = await MapLinks.getLinkByLocations(await player.getDestinationId(), destinationMaps[0]);
		await Maps.startTravel(player, newLink, interaction.createdAt.valueOf(), NumberChangeReason.BIG_EVENT);
		await destinationChoseMessage(player, destinationMaps[0], interaction, language);
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
		await Maps.startTravel(player, newLink, interaction.createdAt.valueOf(), NumberChangeReason.BIG_EVENT);
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
 * Updates the player's information depending on the random possibility drawn
 * @param player
 * @param randomPossibility
 * @param textInformation
 * @param changes
 */
async function updatePlayerInfos(
	player: Player,
	randomPossibility: Possibility,
	textInformation: TextInformation,
	changes: { scoreChange: number, moneyChange: number }
): Promise<void> {
	await player.addHealth(randomPossibility.health, textInformation.interaction.channel, textInformation.language, NumberChangeReason.BIG_EVENT);
	const valuesToEditParameters = {
		player,
		channel: textInformation.interaction.channel,
		language: textInformation.language,
		reason: NumberChangeReason.BIG_EVENT
	};
	await player.addScore(Object.assign(valuesToEditParameters, {amount: changes.scoreChange}));
	await player.addMoney(Object.assign(valuesToEditParameters, {amount: changes.moneyChange}));
	await player.addExperience(Object.assign(valuesToEditParameters, {amount: randomPossibility.experience}));

	if (randomPossibility.nextEvent !== undefined) {
		player.nextEvent = randomPossibility.nextEvent;
	}

	await player.setLastReportWithEffect(
		randomPossibility.lostTime,
		randomPossibility.effect
	);
	if (randomPossibility.item) {
		await giveRandomItem((await textInformation.interaction.guild.members.fetch(player.discordUserId)).user, textInformation.interaction.channel, textInformation.language, player);
	}

	if (randomPossibility.oneshot) {
		await player.addHealth(-player.health, textInformation.interaction.channel, textInformation.language, NumberChangeReason.BIG_EVENT);
	}

	if (randomPossibility.eventId === 0) {
		await player.addMoney({
			amount: -player.money,
			channel: textInformation.interaction.channel,
			language: textInformation.language,
			reason: NumberChangeReason.BIG_EVENT
		});
		await player.addScore({
			amount: -player.score,
			channel: textInformation.interaction.channel,
			language: textInformation.language,
			reason: NumberChangeReason.BIG_EVENT
		});
		if (randomPossibility.possibilityKey !== "end") {
			await player.addMoney({
				amount: 10 - player.money,
				channel: textInformation.interaction.channel,
				language: textInformation.language,
				reason: NumberChangeReason.BIG_EVENT
			});
			await player.addScore({
				amount: 100 - player.score,
				channel: textInformation.interaction.channel,
				language: textInformation.language,
				reason: NumberChangeReason.BIG_EVENT
			});
		}
	}
}

/**
 * Get the changes between before and after the possibility treated
 * @param time
 * @param player
 * @param randomPossibility
 */
async function getChanges(time: number, player: Player, randomPossibility: Possibility): Promise<{ scoreChange: number, moneyChange: number }> {
	const scoreChange = time + RandomUtils.draftbotRandom.integer(0, time / Constants.REPORT.BONUS_POINT_TIME_DIVIDER) + await PlayerSmallEvents.calculateCurrentScore(player);
	let moneyChange = randomPossibility.money + Math.round(time / 10 + RandomUtils.draftbotRandom.integer(0, time / 10 + player.level / 5 - 1));
	if (randomPossibility.money < 0 && moneyChange > 0) {
		moneyChange = Math.round(randomPossibility.money / 2);
	}
	return {scoreChange, moneyChange};
}

/**
 * Get the description of the drawn possibility and update the player
 * @param time
 * @param player
 * @param randomPossibility
 * @param textInformation
 */
async function getDescriptionPossibilityResult(
	time: number,
	player: Player,
	randomPossibility: Possibility,
	textInformation: TextInformation
): Promise<string> {
	const changes = await getChanges(time, player, randomPossibility);
	let result = "";
	result += textInformation.tr.format("points", {score: changes.scoreChange});
	if (changes.moneyChange !== 0) {
		result += changes.moneyChange >= 0
			? textInformation.tr.format("money", {money: changes.moneyChange})
			: textInformation.tr.format("moneyLoose", {money: -changes.moneyChange});
	}
	if (randomPossibility.experience > 0) {
		result += textInformation.tr.format("experience", {experience: randomPossibility.experience});
	}
	if (randomPossibility.health < 0) {
		result += textInformation.tr.format("healthLoose", {health: -randomPossibility.health});
	}
	if (randomPossibility.health > 0) {
		result += textInformation.tr.format("health", {health: randomPossibility.health});
	}
	if (randomPossibility.lostTime > 0 && randomPossibility.effect === EffectsConstants.EMOJI_TEXT.OCCUPIED) {
		result += textInformation.tr.format("timeLost", {timeLost: minutesDisplay(randomPossibility.lostTime)});
	}
	let emojiEnd = randomPossibility.effect !== EffectsConstants.EMOJI_TEXT.SMILEY && randomPossibility.effect !== EffectsConstants.EMOJI_TEXT.OCCUPIED ? ` ${randomPossibility.effect}` : "";

	emojiEnd = randomPossibility.oneshot === true ? ` ${EffectsConstants.EMOJI_TEXT.DEAD} ` : emojiEnd;

	await updatePlayerInfos(player, randomPossibility, textInformation, changes);

	return textInformation.tr.format("doPossibility", {
		pseudo: textInformation.interaction.user,
		result,
		event: randomPossibility.getText(textInformation.language),
		emoji: randomPossibility.possibilityKey === "end" ? "" : `${randomPossibility.possibilityKey} `,
		alte: emojiEnd
	});
}

/**
 * @param textInformation
 * @param {Possibility} possibility
 * @param {Player} player
 * @param {Number} time
 * @return {Promise<CommandInteraction>}
 */
async function doPossibility(
	textInformation: TextInformation,
	possibility: Possibility[],
	player: Player,
	time: number
): Promise<Message> {
	[player] = await Players.getOrRegister(player.discordUserId);
	textInformation.tr = Translations.getModule("commands.report", textInformation.language);

	if (possibility[0].eventId === 0 && possibility[0].possibilityKey === "end") { // Don't do anything if the player ends the first report
		draftBotInstance.logsDatabase.logBigEvent(player.discordUserId, possibility[0].eventId, possibility[0].possibilityKey, 0).then();
		BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.REPORT);
		return await textInformation.interaction.channel.send({
			content: textInformation.tr.format("doPossibility", {
				pseudo: textInformation.interaction.user,
				result: "",
				event: possibility[0].getText(textInformation.language),
				emoji: "",
				alte: ""
			})
		});
	}

	const randomPossibilityIndex = RandomUtils.randInt(0, possibility.length);
	const randomPossibility = possibility[randomPossibilityIndex];
	draftBotInstance.logsDatabase.logBigEvent(player.discordUserId, randomPossibility.eventId, randomPossibility.possibilityKey, randomPossibilityIndex).then();
	const result = await getDescriptionPossibilityResult(time, player, randomPossibility, textInformation);

	BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.REPORT);
	const resultMsg = await textInformation.interaction.channel.send({content: result});

	if (!await player.killIfNeeded(textInformation.interaction.channel, textInformation.language, NumberChangeReason.BIG_EVENT)) {
		await chooseDestination(player, textInformation.interaction, textInformation.language, randomPossibility.restrictedMaps);
	}

	await MissionsController.update(player, textInformation.interaction.channel, textInformation.language, {missionId: "doReports"});
	const tagsToVerify = (await Tags.findTagsFromObject(randomPossibility.id, Possibility.name)).concat(await Tags.findTagsFromObject(randomPossibility.eventId, BigEvent.name));
	if (tagsToVerify) {
		for (let i = 0; i < tagsToVerify.length; i++) {
			await MissionsController.update(player, textInformation.interaction.channel, textInformation.language, {
				missionId: tagsToVerify[i].textTag,
				params: {tags: tagsToVerify}
			});
		}
	}
	await player.save();
	await player.save();
	return resultMsg;
}

/**
 * @param textInformation
 * @param {BigEvent} event
 * @param {Player} player
 * @param {Number} time
 * @return {Promise<void>}
 */
async function doEvent(textInformation: TextInformation, event: BigEvent, player: Player, time: number): Promise<void> {
	const eventDisplayed = await textInformation.interaction.editReply({
		content: Translations.getModule("commands.report", textInformation.language).format("doEvent", {
			pseudo: textInformation.interaction.user,
			event: event.getText(textInformation.language)
		})
	}) as Message;
	const reactions = await event.getReactions();
	const collector = eventDisplayed.createReactionCollector({
		filter: (reaction, user) => reactions.indexOf(reaction.emoji.name) !== -1 && user.id === textInformation.interaction.user.id,
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.REPORT, collector);

	collector.on("collect", async (reaction) => {
		collector.stop();
		if (reaction.emoji.name === Constants.REPORT.QUICK_END_EMOTE) {
			return;
		}
		const possibility = await Possibility.findAll({
			where: {
				eventId: event.id,
				possibilityKey: reaction.emoji.name
			}
		});
		await doPossibility(textInformation, possibility, player, time);
	});

	collector.on("end", async (collected) => {
		if (!collected.first() || collected.firstKey() === Constants.REPORT.QUICK_END_EMOTE) {
			const possibility = await Possibility.findAll({
				where: {
					eventId: event.id,
					possibilityKey: "end"
				}
			});
			await doPossibility(textInformation, possibility, player, time);
		}
	});
	for (const reaction of reactions) {
		if (reaction !== "end" && reaction !== Constants.REPORT.QUICK_END_EMOTE) {
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

	// nextEvent is defined ?
	if (player.nextEvent !== undefined && player.nextEvent !== null) {
		forceSpecificEvent = player.nextEvent;
	}

	if (forceSpecificEvent === -1 || !forceSpecificEvent) {
		const map = await player.getDestination();
		[event] = await BigEvents.pickEventOnMapType(map);
		if (!event) {
			await interaction.channel.send({content: "It seems that there is no event here... It's a bug, please report it to the DraftBot staff."});
			return;
		}
	}
	else {
		event = await BigEvent.findOne({where: {id: forceSpecificEvent}});
	}
	await Maps.stopTravel(player);
	return await doEvent({interaction, language}, event, player, time);
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

	BlockingUtils.blockPlayer(player.discordUserId, "reportCommand", Constants.MESSAGES.COLLECTOR_TIME * 3); // maxTime here is to prevent any accident permanent blocking

	await MissionsController.update(player, interaction.channel, language, {missionId: "commandReport"});

	const currentDate = new Date();

	if (forceSpecificEvent || await needBigEvent(player, currentDate)) {
		await interaction.deferReply();
		await doRandomBigEvent(interaction, language, player, forceSpecificEvent);
		return BlockingUtils.unblockPlayer(player.discordUserId, "reportCommand");
	}

	if (forceSmallEvent || await needSmallEvent(player, currentDate)) {
		await interaction.deferReply();
		await executeSmallEvent(interaction, language, player, forceSmallEvent);
		return BlockingUtils.unblockPlayer(player.discordUserId, "reportCommand");
	}

	if (!player.currentEffectFinished(currentDate)) {
		await sendTravelPath(player, interaction, language, currentDate, player.effect);
		return BlockingUtils.unblockPlayer(player.discordUserId, "reportCommand");
	}

	if (player.effect !== EffectsConstants.EMOJI_TEXT.SMILEY && player.currentEffectFinished(currentDate)) {
		await MissionsController.update(player, interaction.channel, language, {missionId: "recoverAlteration"});
	}

	if (player.mapLinkId === null) {
		await Maps.startTravel(player, await MapLinks.getRandomLink(), interaction.createdAt.valueOf(), NumberChangeReason.DEBUG);
		return BlockingUtils.unblockPlayer(player.discordUserId, "reportCommand");
	}

	if (!Maps.isTravelling(player)) {
		await chooseDestination(player, interaction, language, null);
		return BlockingUtils.unblockPlayer(player.discordUserId, "reportCommand");
	}

	await sendTravelPath(player, interaction, language, currentDate, null);
	BlockingUtils.unblockPlayer(player.discordUserId, "reportCommand");
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