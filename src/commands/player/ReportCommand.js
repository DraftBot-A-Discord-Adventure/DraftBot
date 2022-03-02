import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {giveRandomItem} from "../../core/utils/ItemUtils";
import {Entities} from "../../core/models/Entity";
import BigEvent, {BigEvents} from "../../core/models/BigEvent";
import {MapLinks} from "../../core/models/MapLink";
import {MapLocations} from "../../core/models/MapLocation";

import {Maps} from "../../core/Maps";
import {PlayerSmallEvents} from "../../core/models/PlayerSmallEvent";
import Possibility from "../../core/models/Possibility";
import {MissionsController} from "../../core/missions/MissionsController";
import {Constants} from "../../core/Constants";
import {hoursToMilliseconds} from "../../core/utils/TimeUtils";
import {Tags} from "../../core/models/Tag";
import {BlockingUtils} from "../../core/utils/BlockingUtils";

module.exports.commandInfo = {
	name: "report",
	aliases: ["r"],
	disallowEffects: [EFFECT.DEAD]
};

/**
 * Allow the user to learn more about what is going on with his character
 * @param {Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @param {Number} forceSpecificEvent - For testing purpose
 * @param {String} forceSmallEvent
 */
const ReportCommand = async (message, language, args, forceSpecificEvent = -1, forceSmallEvent = null) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (entity.Player.score === 0 && entity.Player.effect === EFFECT.BABY) {
		entity.Player.mapLinkId = Constants.BEGINNING.START_MAP_LINK;
		entity.Player.startTravelDate = new Date(Date.now() - hoursToMilliseconds((await MapLinks.getById(entity.Player.mapLinkId)).tripDuration));
		entity.Player.effect = Constants.EFFECT.SMILEY;
		await entity.Player.save();
	}

	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	await MissionsController.update(entity.discordUserId, message.channel, language, "commandReport");

	if (!entity.Player.currentEffectFinished()) {
		return await sendTravelPath(entity, message, language, entity.Player.effect);
	}

	if (entity.Player.effect !== Constants.EFFECT.SMILEY && entity.Player.currentEffectFinished()) {
		await MissionsController.update(entity.discordUserId, message.channel, language, "recoverAlteration");
	}

	if (entity.Player.mapLinkId === null) {
		return await Maps.startTravel(entity.player, await MapLinks.getRandomLink(), message.createdAt.valueOf());
	}

	if (!Maps.isTravelling(entity.Player)) {
		return await chooseDestination(entity, message, language);
	}

	if (await needBigEvent(entity)) {
		return await doRandomBigEvent(message, language, entity, forceSpecificEvent);
	}

	if (forceSmallEvent !== null || needSmallEvent(entity)) {
		return await executeSmallEvent(message, language, entity, forceSmallEvent);
	}

	return await sendTravelPath(entity, message, language, null);
};

/**
 * Picks a random event (or the forced one) and executes it
 * @param {Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {Number} forceSpecificEvent
 * @returns {Promise<void>}
 */
const doRandomBigEvent = async function(message, language, entity, forceSpecificEvent) {
	await MissionsController.update(entity.discordUserId, message.channel, language, "travelHours", 1, {
		travelTime: await entity.Player.getCurrentTripDuration()
	});
	await MissionsController.update(entity.discordUserId, message.channel, language, "goToPlace", 1, {mapId: (await MapLinks.getById(entity.Player.mapLinkId)).endMap});
	let time;
	if (forceSpecificEvent === -1) {
		time = millisecondsToMinutes(message.createdAt.valueOf() - entity.Player.startTravelDate);
	}
	else {
		time = JsonReader.commands.report.timeMaximal + 1;
	}
	if (time > JsonReader.commands.report.timeLimit) {
		time = JsonReader.commands.report.timeLimit;
	}

	let event;

	// nextEvent is defined ?
	if (entity.Player.nextEvent !== undefined && entity.Player.nextEvent !== null) {
		forceSpecificEvent = entity.Player.nextEvent;
	}

	if (forceSpecificEvent === -1) {
		const map = await entity.Player.getDestination();
		[event] = await BigEvents.pickEventOnMapType(map);
		if (!event) {
			await message.channel.send({content: "It seems that there is no event here... It's a bug, please report it to the Draftbot staff."});
			return;
		}
	}
	else {
		event = await BigEvent.findOne({where: {id: forceSpecificEvent}});
	}
	await Maps.stopTravel(entity.Player);
	return await doEvent(message, language, event, entity, time);
};

/**
 * If the entity reached his destination (= big event)
 * @param {Entities} entity
 * @returns {boolean}
 */
const needBigEvent = async function(entity) {
	return await Maps.isArrived(entity.Player);
};

/**
 * Sends an embed with the travel path and an advice
 * @param {Entities} entity
 * @param {Message} message
 * @param {"fr"|"en"} language
 * @param {string|String} effect
 * @returns {Promise<Message>}
 */
const sendTravelPath = async function(entity, message, language, effect = null) {
	const travelEmbed = new DraftBotEmbed();
	const tr = JsonReader.commands.report.getTranslation(language);
	travelEmbed.formatAuthor(tr.travelPathTitle, message.author);
	travelEmbed.setDescription(await Maps.generateTravelPathString(entity.Player, language, effect));
	travelEmbed.addField(tr.startPoint, (await entity.Player.getPreviousMap()).getDisplayName(language), true);
	travelEmbed.addField(tr.endPoint, (await entity.Player.getDestination()).getDisplayName(language), true);
	if (effect !== null) {
		const errorMessageObject = effectsErrorMeTextValue(message, language, entity, effect);
		travelEmbed.addField(errorMessageObject.title, errorMessageObject.description, false);
	}
	else {
		let milisecondsBeforeSmallEvent = 0;
		if (entity.Player.PlayerSmallEvents.length !== 0) {
			const lastMiniEvent = PlayerSmallEvents.getLast(entity.Player.PlayerSmallEvents);
			const lastTime = lastMiniEvent.time > entity.Player.effectEndDate.valueOf() ? lastMiniEvent.time : entity.Player.effectEndDate.valueOf();
			milisecondsBeforeSmallEvent = lastTime + REPORT.TIME_BETWEEN_MINI_EVENTS - Date.now();
		}
		const milisecondsBeforeBigEvent = hoursToMilliseconds(await entity.Player.getCurrentTripDuration()) - Maps.getTravellingTime(entity.Player);
		if (milisecondsBeforeSmallEvent >= milisecondsBeforeBigEvent) {
			// if there is no small event before the big event, do not display anything
			travelEmbed.addField(tr.travellingTitle, tr.travellingDescriptionEndTravel, false);
		}
		else if (entity.Player.PlayerSmallEvents.length !== 0) {
			// the first mini event of the travel is calculated differently
			const lastMiniEvent = PlayerSmallEvents.getLast(entity.Player.PlayerSmallEvents);
			const lastTime = lastMiniEvent.time > entity.Player.effectEndDate.valueOf() ? lastMiniEvent.time : entity.Player.effectEndDate.valueOf();
			travelEmbed.addField(tr.travellingTitle, format(tr.travellingDescription, {
				smallEventEmoji: JsonReader.smallEvents[lastMiniEvent.eventType].emote,
				time: parseTimeDifference(lastTime + REPORT.TIME_BETWEEN_MINI_EVENTS, Date.now(), language)
			}), false);
		}
		else {
			travelEmbed.addField(tr.travellingTitle, format(tr.travellingDescriptionWithoutSmallEvent, {
				time: parseTimeDifference(entity.Player.startTravelDate.valueOf() + REPORT.TIME_BETWEEN_MINI_EVENTS, Date.now(), language)
			}), false);
		}
	}

	travelEmbed.addField(tr.collectedPointsTitle, "🏅 " + await PlayerSmallEvents.calculateCurrentScore(entity.Player), true);

	travelEmbed.addField(tr.adviceTitle, JsonReader.advices.getTranslation(language).advices[randInt(0, JsonReader.advices.getTranslation(language).advices.length - 1)], true);
	return await message.channel.send({embeds: [travelEmbed]});
};


const destinationChoiceEmotes = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣"];

/**
 * Executes the choice of the next destination
 * @param {Entities} entity
 * @param {Message} message
 * @param {"fr"|"en"} language
 * @param {string|String} restrictedMapType
 * @returns {Promise<void>}
 */
const chooseDestination = async function(entity, message, language, restrictedMapType) {
	await PlayerSmallEvents.removeSmallEventsOfPlayer(entity.Player.id);
	const destinationMaps = await Maps.getNextPlayerAvailableMaps(entity.Player, restrictedMapType);

	if (destinationMaps.length === 0) {
		return log(message.author + " hasn't any destination map (current map: " + await entity.Player.getDestinationId() + ", restrictedMapType: " + restrictedMapType + ")");
	}

	if (destinationMaps.length === 1 || draftbotRandom.bool(1, 3) && entity.Player.mapLinkId !== Constants.BEGINNING.LAST_MAP_LINK) {
		const newLink = await MapLinks.getLinkByLocations(await entity.Player.getDestinationId(), destinationMaps[0]);
		await Maps.startTravel(entity.Player, newLink, message.createdAt.valueOf());
		return await destinationChoseMessage(entity, destinationMaps[0], message, language);
	}

	const tr = JsonReader.commands.report.getTranslation(language);
	const chooseDestinationEmbed = new DraftBotEmbed();
	chooseDestinationEmbed.formatAuthor(tr.destinationTitle, message.author);
	let desc = tr.chooseDestinationIndications + "\n";
	for (let i = 0; i < destinationMaps.length; ++i) {
		const map = await MapLocations.getById(destinationMaps[i]);
		const link = await MapLinks.getLinkByLocations(await entity.Player.getDestinationId(), destinationMaps[i]);
		const duration = draftbotRandom.bool() ? link.tripDuration : "?";
		desc += destinationChoiceEmotes[i] + " - " + map.getDisplayName(language) + " (" + duration + "h)\n";
	}
	chooseDestinationEmbed.setDescription(desc);

	const sentMessage = await message.channel.send({embeds: [chooseDestinationEmbed]});

	const collector = sentMessage.createReactionCollector({
		filter: (reaction, user) => destinationChoiceEmotes.indexOf(reaction.emoji.name) !== -1 && user.id === message.author.id,
		time: COLLECTOR_TIME
	});

	collector.on("collect", () => {
		collector.stop();
	});

	collector.on("end", async (collected) => {
		const mapId = collected.first() ? destinationMaps[destinationChoiceEmotes.indexOf(collected.first().emoji.name)] : destinationMaps[randInt(0, destinationMaps.length - 1)];
		const newLink = await MapLinks.getLinkByLocations(await entity.Player.getDestinationId(), mapId);
		await Maps.startTravel(entity.Player, newLink, message.createdAt.valueOf());
		await destinationChoseMessage(entity, mapId, message, language);
		await BlockingUtils.unblockPlayer(entity.discordUserId);
	});

	await BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "chooseDestination", collector);
	for (let i = 0; i < destinationMaps.length; ++i) {
		try {
			await sentMessage.react(destinationChoiceEmotes[i]);
		}
		catch (e) {
			console.error(e);
		}
	}
};

/**
 * Function called to display the direction chosen by a player
 * @param entity
 * @param map
 * @param message
 * @param language
 * @returns {Promise<void>}
 */
const destinationChoseMessage = async function(entity, map, message, language) {
	const tr = JsonReader.commands.report.getTranslation(language);
	const typeTr = JsonReader.models.maps.getTranslation(language);
	const mapInstance = await MapLocations.getById(map);
	const destinationEmbed = new DraftBotEmbed();
	destinationEmbed.formatAuthor(tr.destinationTitle, message.author);
	const tripDuration = await entity.Player.getCurrentTripDuration();
	if (tripDuration < 1) {
		destinationEmbed.setDescription(format(tr.choseMapMinutes, {
			mapPrefix: typeTr.types[mapInstance.type].prefix,
			mapName: mapInstance.getDisplayName(language),
			mapType: typeTr.types[mapInstance.type].name.toLowerCase(),
			time: Math.round(tripDuration * 60)
		}));
	}
	else {
		destinationEmbed.setDescription(format(tr.choseMap, {
			mapPrefix: typeTr.types[mapInstance.type].prefix,
			mapName: mapInstance.getDisplayName(language),
			mapType: typeTr.types[mapInstance.type].name.toLowerCase(),
			time: tripDuration
		}));
	}
	await message.channel.send({embeds: [destinationEmbed]});
};

/**
 * @param {Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Events} event
 * @param {Entities} entity
 * @param {Number} time
 * @param {Number} forcePoints Force a certain number of points to be given instead of random
 * @return {Promise<void>}
 */
const doEvent = async (message, language, event, entity, time, forcePoints = 0) => {
	const eventDisplayed = await message.channel.send({
		content: format(JsonReader.commands.report.getTranslation(language).doEvent, {
			pseudo: message.author,
			event: event[language]
		})
	});
	const reactions = await event.getReactions();
	const collector = eventDisplayed.createReactionCollector({
		filter: (reaction, user) => reactions.indexOf(reaction.emoji.name) !== -1 && user.id === message.author.id,
		time: COLLECTOR_TIME
	});

	await BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "report", collector);

	collector.on("collect", async (reaction) => {
		collector.stop();
		if (reaction.emoji.name === REPORT.QUICK_END_EMOTE) {
			return;
		}
		const possibility = await Possibility.findAll({
			where: {
				eventId: event.id,
				possibilityKey: reaction.emoji.name
			}
		});
		await doPossibility(message, language, possibility, entity, time, forcePoints);
	});

	collector.on("end", async (collected) => {
		if (!collected.first() || collected.firstKey() === REPORT.QUICK_END_EMOTE) {
			const possibility = await Possibility.findAll({
				where: {
					eventId: event.id,
					possibilityKey: "end"
				}
			});
			await doPossibility(message, language, possibility, entity, time, forcePoints);
		}
	});
	for (const reaction of reactions) {
		if (reaction !== "end" && reaction !== REPORT.QUICK_END_EMOTE) {
			await eventDisplayed.react(reaction)
				.catch();
		}
	}
};

/**
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Possibility} possibility
 * @param {Entities} entity
 * @param {Number} time
 * @param {Number} forcePoints Force a certain number of points to be given instead of random
 * @return {Promise<module:"discord.js".Message>}
 */
const doPossibility = async (message, language, possibility, entity, time, forcePoints = 0) => {
	[entity] = await Entities.getOrRegister(entity.discordUserId);
	const player = entity.Player;

	if (possibility.length === 1) { // Don't do anything if the player ends the first report
		if (possibility[0].dataValues.eventId === 0 && possibility[0].dataValues.possibilityKey === "end") {
			BlockingUtils.unblockPlayer(entity.discordUserId);
			return await message.channel.send({
				content: format(JsonReader.commands.report.getTranslation(language).doPossibility, {
					pseudo: message.author,
					result: "",
					event: possibility[0].dataValues[language],
					emoji: "",
					alte: ""
				})
			});
		}
	}

	possibility = possibility[randInt(0, possibility.length)];
	const pDataValues = possibility.dataValues;
	let scoreChange;
	if (forcePoints !== 0) {
		scoreChange = forcePoints;
	}
	else {
		scoreChange = time + draftbotRandom.integer(0, time / REPORT.BONUS_POINT_TIME_DIVIDER) + await PlayerSmallEvents.calculateCurrentScore(entity.Player);
	}
	let moneyChange = pDataValues.money + Math.round(time / 10 + draftbotRandom.integer(0, time / 10 + player.level / 5 - 1));
	if (pDataValues.money < 0 && moneyChange > 0) {
		moneyChange = Math.round(pDataValues.money / 2);
	}
	let result = "";
	result += format(JsonReader.commands.report.getTranslation(language).points, {score: scoreChange});
	if (moneyChange !== 0) {
		result += moneyChange >= 0
			? format(JsonReader.commands.report.getTranslation(language).money, {money: moneyChange})
			: format(JsonReader.commands.report.getTranslation(language).moneyLoose, {money: -moneyChange});
	}
	if (pDataValues.experience > 0) {
		result += format(JsonReader.commands.report.getTranslation(language).experience, {experience: pDataValues.experience});
	}
	if (pDataValues.health < 0) {
		result += format(JsonReader.commands.report.getTranslation(language).healthLoose, {health: -pDataValues.health});
	}
	if (pDataValues.health > 0) {
		result += format(JsonReader.commands.report.getTranslation(language).health, {health: pDataValues.health});
	}
	if (pDataValues.lostTime > 0 && pDataValues.effect === ":clock2:") {
		result += format(JsonReader.commands.report.getTranslation(language).timeLost, {timeLost: minutesToString(pDataValues.lostTime)});
	}
	let emojiEnd = pDataValues.effect !== EFFECT.SMILEY && pDataValues.effect !== EFFECT.OCCUPIED ? " " + pDataValues.effect : "";

	emojiEnd = pDataValues.oneshot === true ? " " + EFFECT.DEAD + " " : emojiEnd;

	if (possibility.dataValues.possibilityKey === "end") {
		result = format(JsonReader.commands.report.getTranslation(language).doPossibility, {
			pseudo: message.author,
			result: result,
			event: possibility[language],
			emoji: "",
			alte: emojiEnd
		});
	}
	else {
		result = format(JsonReader.commands.report.getTranslation(language).doPossibility, {
			pseudo: message.author,
			result: result,
			event: possibility[language],
			emoji: possibility.dataValues.possibilityKey + " ",
			alte: emojiEnd
		});
	}

	await entity.addHealth(pDataValues.health, message.channel, language);

	await player.addScore(entity, scoreChange, message.channel, language);
	await player.addMoney(entity, moneyChange, message.channel, language);
	await player.addExperience(possibility.experience, entity, message.channel, language);

	if (pDataValues.nextEvent !== undefined) {
		player.nextEvent = pDataValues.nextEvent;
	}

	if (pDataValues.eventId !== 0) {
		await player.setLastReportWithEffect(message.createdTimestamp, pDataValues.lostTime, pDataValues.effect);
	}
	else {
		await player.setLastReportWithEffect(0, pDataValues.lostTime, pDataValues.effect);
	}

	if (pDataValues.item === true) {
		await giveRandomItem((await message.guild.members.fetch(entity.discordUserId)).user, message.channel, language, entity);
	}
	else {
		BlockingUtils.unblockPlayer(entity.discordUserId);
	}

	if (pDataValues.oneshot === true) {
		entity.setHealth(0, message.channel, language);
	}

	if (pDataValues.eventId === 0) {
		player.money = 0;
		player.score = 0;
		if (pDataValues.emoji !== "end") {
			player.money = 10;
			player.score = 100;
		}
	}

	BlockingUtils.unblockPlayer(entity.discordUserId);
	const resultMsg = await message.channel.send({content: result});

	if (!await player.killIfNeeded(entity, message.channel, language)) {
		await chooseDestination(entity, message, language, pDataValues.restrictedMaps);
	}

	await MissionsController.update(entity.discordUserId, message.channel, language, "doReports");
	const tagsToVerify = (await Tags.findTagsFromObject(pDataValues.id, Possibility.name)).concat(await Tags.findTagsFromObject(pDataValues.eventId, BigEvent.name));
	if (tagsToVerify) {
		for (let i = 0; i < tagsToVerify.length; i++) {
			await MissionsController.update(entity.discordUserId, message.channel, language, tagsToVerify[i].textTag, 1, {tags: tagsToVerify});
		}
	}
	await entity.save();
	await player.save();
	return resultMsg;
};

/* ---------------------------------------------------------------
											SMALL EVENTS FUNCTIONS
--------------------------------------------------------------- */

/**
 * Returns if the entity reached a stopping point (= small event)
 * @param {Entities} entity
 * @returns {boolean}
 */
const needSmallEvent = function(entity) {
	if (entity.Player.PlayerSmallEvents.length !== 0) {
		const lastMiniEvent = PlayerSmallEvents.getLast(entity.Player.PlayerSmallEvents);
		const lastTime = lastMiniEvent.time > entity.Player.effectEndDate.valueOf() ? lastMiniEvent.time : entity.Player.effectEndDate.valueOf();
		return Date.now() >= lastTime + REPORT.TIME_BETWEEN_MINI_EVENTS;
	}
	return Date.now() >= entity.Player.startTravelDate.valueOf() + REPORT.TIME_BETWEEN_MINI_EVENTS;
};

/**
 * Executes a small event
 * @param {Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {Boolean} forced
 * @returns {Promise<void>}
 */
const executeSmallEvent = async (message, language, entity, forced) => {

	// Pick random event
	let event;
	if (forced === null) {
		const smallEvents = JsonReader.smallEvents;
		const keys = Object.keys(smallEvents);
		let totalSmallEventsRarity = 0;
		const updatedKeys = [];
		for (let i = 0; i < keys.length; ++i) {
			const file = require(require.resolve("../../core/smallEvents/" + keys[i] + "SmallEvent.js"));
			if (!file.smallEvent || !file.smallEvent.canBeExecuted) {
				await message.channel.send({content: keys[i] + " doesn't contain a canBeExecuted function"});
				return;
			}
			if (await file.smallEvent.canBeExecuted(entity)) {
				updatedKeys.push(keys[i]);
				totalSmallEventsRarity += smallEvents[keys[i]].rarity;
			}
		}
		const randomNb = randInt(1, totalSmallEventsRarity);
		let cumul = 0;
		for (let i = 0; i < updatedKeys.length; ++i) {
			cumul += smallEvents[updatedKeys[i]].rarity;
			if (cumul >= randomNb) {
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
		const smallEventModule = require.resolve("../../core/smallEvents/" + filename);
		try {
			const smallEventFile = require(smallEventModule);
			if (!smallEventFile.smallEvent.executeSmallEvent) {
				await message.channel.send({content: filename + " doesn't contain an executeSmallEvent function"});
			}
			else {
				// Create a template embed
				const seEmbed = new DraftBotEmbed()
					.formatAuthor(JsonReader.commands.report.getTranslation(language).journal, message.author)
					.setDescription(JsonReader.smallEvents[event].emote + " ");

				await smallEventFile.smallEvent.executeSmallEvent(message, language, entity, seEmbed);

				await MissionsController.update(entity.discordUserId, message.channel, language, "doReports");
			}
		}
		catch (e) {
			console.error(e);
		}
	}
	catch (e) {
		await message.channel.send({content: filename + " doesn't exist"});
	}

	// Save
	PlayerSmallEvents.createPlayerSmallEvent(entity.Player.id, event, Date.now())
		.save();
};

/* ------------------------------------------------------------ */


module.exports.execute = ReportCommand;
