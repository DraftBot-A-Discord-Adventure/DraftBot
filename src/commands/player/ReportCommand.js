const Op = require('sequelize/lib/operators');
const Maps = require('../../core/Maps');

/**
 * Allow the user to learn more about what is going on with his character
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @param {Number} forceSpecificEvent - For testing purpose
 */
const ReportCommand = async function (language, message, args, forceSpecificEvent = -1, forceSmallEvent = null) {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.DEAD], entity)) !== true) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	if (entity.Player.score === 0 && entity.Player.effect === EFFECT.BABY) {
		const event = await Events.findOne({where: {id: 0}});
		return await doEvent(message, language, event, entity, REPORT.TIME_BETWEEN_BIG_EVENTS / 1000 / 60, 100);
	}

	if (!entity.Player.currentEffectFinished()) {
		return await effectsErrorMe(
			message,
			language,
			entity,
			entity.Player.effect
		);
	}

	if (!Maps.isTravelling(entity.Player)) {
		return await chooseDestination(entity, message, language);
	}

	if (needBigEvent(entity)) {
		return await doRandomBigEvent(message, language, entity, forceSpecificEvent);
	}

	const smallEventNumber = triggersSmallEvent(entity);
	if (forceSmallEvent != null || smallEventNumber !== -1) {
		return await executeSmallEvent(message, language, entity, smallEventNumber, forceSmallEvent);
	}

	return await sendTravelPath(entity, message, language);
};

/**
 * Picks a random event (or the forced one) and executes it
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {Number} forceSpecificEvent
 * @returns {Promise<void>}
 */
const doRandomBigEvent = async function (message, language, entity, forceSpecificEvent) {
	let time;
	if (forceSpecificEvent === -1) {
		time = millisecondsToMinutes(message.createdAt.getTime() - entity.Player.start_travel_date);
	} else {
		time = JsonReader.commands.report.timeMaximal + 1;
	}
	if (time > JsonReader.commands.report.timeLimit) {
		time = JsonReader.commands.report.timeLimit;
	}

	const Sequelize = require('sequelize');
	let event;

	// nextEvent is defined ?
	if (entity.Player.nextEvent !== undefined && entity.Player.nextEvent !== null) {
		forceSpecificEvent = entity.Player.nextEvent;
	}

	if (forceSpecificEvent === -1) {
		const map = await MapLocations.getById(entity.Player.map_id);
		[event] = await Events.pickEventOnMapType(map);
		if (!event) {
			await message.channel.send("It seems that there is no event here... It's a bug, please report it to the Draftbot staff.");
			return;
		}
	} else {
		event = await Events.findOne({where: {id: forceSpecificEvent}});
	}
	await Maps.stopTravel(entity.Player);
	return await doEvent(message, language, event, entity, time);
};

/**
 * If the entity reached his destination (= big event)
 * @param {Entities} entity
 * @returns {boolean}
 */
const needBigEvent = function (entity) {
	return Maps.getTravellingTime(entity.Player) >= 2*60*60*1000;
};

/**
 * Sends an embed with the travel path and an advice
 * @param {Entities} entity
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @returns {Promise<Message>}
 */
const sendTravelPath = async function (entity, message, language) {
	let travelEmbed = new discord.MessageEmbed();
	const tr = JsonReader.commands.report.getTranslation(language);
	travelEmbed.setAuthor(tr.travelPathTitle, message.author.displayAvatarURL());
	travelEmbed.setDescription(await Maps.generateTravelPathString(entity.Player, language));
	travelEmbed.addField(tr.startPoint, (await MapLocations.getById(entity.Player.previous_map_id)).getDisplayName(language), true);
	travelEmbed.addField(tr.endPoint, (await MapLocations.getById(entity.Player.map_id)).getDisplayName(language), true);
	travelEmbed.addField(tr.adviceTitle, JsonReader.advices.getTranslation(language).advices[randInt(0, JsonReader.advices.getTranslation(language).advices.length - 1)], false);
	return await message.channel.send(travelEmbed);
};

const destinationChoiceEmotes = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣"];

/**
 * Executes the choice of the next destination
 * @param {Entities} entity
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {string|String} restricted_map_type
 * @returns {Promise<void>}
 */
const chooseDestination = async function (entity, message, language, restricted_map_type) {
	await PlayerSmallEvents.removeSmallEventsOfPlayer(entity.Player.id);
	const destinationMaps = await Maps.getNextPlayerAvailableMaps(entity.Player, restricted_map_type);

	if (destinationMaps.length === 0) {
		return log(message.author + " hasn't any destination map (current map: " + entity.Player.map_id + ", restricted_map_type: " + restricted_map_type + ")");
	}

	if (destinationMaps.length === 1 || draftbotRandom.bool(1, 3)) {
		await Maps.startTravel(entity.Player, destinationMaps[0],message.createdAt.getTime());
		return await destinationChoseMessage(entity, destinationMaps[0], message, language);
	}

	const tr = JsonReader.commands.report.getTranslation(language);
	let chooseDestinationEmbed = new discord.MessageEmbed();
	chooseDestinationEmbed.setAuthor(format(tr.destinationTitle, {pseudo: message.author.username}), message.author.displayAvatarURL());
	let desc = tr.chooseDestinationIndications + "\n";
	for (let i = 0; i < destinationMaps.length; ++i) {
		const map = await MapLocations.getById(destinationMaps[i]);
		desc += destinationChoiceEmotes[i] + " - " + map.getDisplayName(language) + "\n";
	}
	chooseDestinationEmbed.setDescription(desc);

	const sentMessage = await message.channel.send(chooseDestinationEmbed);

	const collector = sentMessage.createReactionCollector((reaction, user) => {
		return destinationChoiceEmotes.indexOf(reaction.emoji.name) !== -1 && user.id === message.author.id;
	}, {time: COLLECTOR_TIME});

	collector.on('collect', async () => {
		collector.stop();
	});

	collector.on('end', async (collected) => {
		const mapId = collected.first() ? destinationMaps[destinationChoiceEmotes.indexOf(collected.first().emoji.name)] : destinationMaps[randInt(0, destinationMaps.length - 1)];
		await Maps.startTravel(entity.Player, mapId, message.createdAt.getTime());
		await destinationChoseMessage(entity, mapId, message, language);
	});

	await addBlockedPlayer(entity.discordUser_id, "chooseDestination", collector);

	for (let i = 0; i < destinationMaps.length; ++i) {
		try {
			await sentMessage.react(destinationChoiceEmotes[i]);
		} catch (e) {
			console.error(e);
		}
	}
};

/**
 * Function called to display the direction chose by a player
 * @param entity
 * @param map
 * @param message
 * @param language
 * @returns {Promise<void>}
 */
const destinationChoseMessage = async function (entity, map, message, language) {
	const tr = JsonReader.commands.report.getTranslation(language);
	const typeTr = JsonReader.models.maps.getTranslation(language);
	const mapInstance = await MapLocations.getById(map);
	let destinationEmbed = new discord.MessageEmbed();
	destinationEmbed.setAuthor(format(tr.destinationTitle, {pseudo: message.author.username}), message.author.displayAvatarURL());
	destinationEmbed.setDescription(format(tr.choseMap, {
		mapPrefix: typeTr.types[mapInstance.type].prefix,
		mapName: mapInstance.getDisplayName(language),
		mapType: typeTr.types[mapInstance.type].name.toLowerCase()
	}));
	await message.channel.send(destinationEmbed);
};

/**
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Event} event
 * @param {Entities} entity
 * @param {Number} time
 * @param {Number} forcePoints Force a certain number of points to be given instead of random
 * @return {Promise<void>}
 */
const doEvent = async (message, language, event, entity, time, forcePoints = 0) => {
	const eventDisplayed = await message.channel.send(format(JsonReader.commands.report.getTranslation(language).doEvent, {
		pseudo: message.author,
		event: event[language]
	}));
	const reactions = await event.getReactions();
	const collector = eventDisplayed.createReactionCollector((reaction, user) => {
		return (reactions.indexOf(reaction.emoji.name) !== -1 && user.id === message.author.id);
	}, {time: COLLECTOR_TIME});

	await addBlockedPlayer(entity.discordUser_id, "report", collector);

	collector.on('collect', async (reaction) => {
		collector.stop();
		const possibility = await Possibilities.findAll({
			where: {
				event_id: event.id,
				possibilityKey: reaction.emoji.name
			}
		});
		await doPossibility(message, language, possibility, entity, time, forcePoints);
	});

	collector.on('end', async (collected) => {
		if (!collected.first()) {
			const possibility = await Possibilities.findAll({where: {event_id: event.id, possibilityKey: 'end'}});
			await doPossibility(message, language, possibility, entity, time, forcePoints);
		}
	});
	for (const reaction of reactions) {
		if (reaction !== 'end') {
			await eventDisplayed.react(reaction).catch();
		}
	}
};

/**
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Possibility} possibility
 * @param {Entity} entity
 * @param {Number} time
 * @param {Number} forcePoints Force a certain number of points to be given instead of random
 * @return {Promise<Message>}
 */
const doPossibility = async (message, language, possibility, entity, time, forcePoints = 0) => {
	[entity] = await Entities.getOrRegister(entity.discordUser_id);
	const player = entity.Player;

	if (possibility.length === 1) { //Don't do anything if the player ends the first report
		if (possibility[0].dataValues.event_id === 0 && possibility[0].dataValues.possibilityKey === "end") {
			removeBlockedPlayer(entity.discordUser_id);
			return await message.channel.send(format(JsonReader.commands.report.getTranslation(language).doPossibility, {
				pseudo: message.author,
				result: "",
				event: possibility[0].dataValues[language],
				emoji: "",
				alte : ''
			}));
		}
	}

	possibility = possibility[randInt(0, possibility.length)];
	const pDataValues = possibility.dataValues;
	let scoreChange;
	if (forcePoints !== 0) {
		scoreChange = forcePoints;
	} else {
		scoreChange = time + draftbotRandom.integer(0, time / 10 + player.level - 1);
	}
	let moneyChange = pDataValues.money + Math.round(time / 10 + draftbotRandom.integer(0, time / 10 + player.level / 5 - 1));
	if (pDataValues.money < 0 && moneyChange > 0) {
		moneyChange = Math.round(pDataValues.money / 2);
	}
	let result = '';
	result += format(JsonReader.commands.report.getTranslation(language).points, {score: scoreChange});
	if (moneyChange !== 0) {
		result += (moneyChange >= 0) ? format(JsonReader.commands.report.getTranslation(language).money, {money: moneyChange}) : format(JsonReader.commands.report.getTranslation(language).moneyLoose, {money: -moneyChange});
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
	let emojiEnd = pDataValues.effect !== EFFECT.SMILEY && pDataValues.effect !== EFFECT.OCCUPIED ? ' ' + pDataValues.effect : '';

	if (possibility.dataValues.possibilityKey === "end") {
		result = format(JsonReader.commands.report.getTranslation(language).doPossibility, {
			pseudo: message.author,
			result: result,
			event: possibility[language],
			emoji: "",
			alte : emojiEnd
		});
	} else {
		result = format(JsonReader.commands.report.getTranslation(language).doPossibility, {
			pseudo: message.author,
			result: result,
			event: possibility[language],
			emoji: possibility.dataValues.possibilityKey + " ",
			alte : emojiEnd
		});
	}

	await entity.addHealth(pDataValues.health);

	player.addScore(scoreChange);
	player.addWeeklyScore(scoreChange);
	player.addMoney(moneyChange);
	player.experience += possibility.experience;

	if (pDataValues.nextEvent !== undefined) {
		player.nextEvent = pDataValues.nextEvent;
	}

	if (pDataValues.event_id !== 0) {
		await player.setLastReportWithEffect(message.createdTimestamp, pDataValues.lostTime, pDataValues.effect);
	} else {
		await player.setLastReportWithEffect(0, pDataValues.lostTime, pDataValues.effect);
	}

	if (pDataValues.item === true) {
		await giveRandomItem((await message.guild.members.fetch(entity.discordUser_id)).user, message.channel, language, entity);
	} else {
		removeBlockedPlayer(entity.discordUser_id);
	}

	if (pDataValues.eventId === 0) {
		player.money = 0;
		player.score = 0;
		if (pDataValues.emoji !== 'end') {
			player.money = 10;
			player.score = 100;
		}
	}

	let resultMsg = await message.channel.send(result);

	while (player.needLevelUp()) {
		await player.levelUpIfNeeded(entity, message.channel, language);
	}

	if (!await player.killIfNeeded(entity, message.channel, language)) { // TODO : check if this work
		await chooseDestination(entity, message, language, pDataValues.restricted_maps);
	}

	entity.save();
	player.save();

	return resultMsg;
};

/* ---------------------------------------------------------------
											SMALL EVENTS FUNCTIONS
--------------------------------------------------------------- */

/**
 * Returns the number of the small event to trigger or -1 if none has to be executed
 * @param {Entities} entity
 * @returns {number}
 */
const triggersSmallEvent = (entity) => {
	const now = new Date();
	const timeBetweenSmallEvents = REPORT.TIME_BETWEEN_BIG_EVENTS / (REPORT.SMALL_EVENTS_COUNT + 1);
	for (let i = 1; i <= REPORT.SMALL_EVENTS_COUNT; ++i) {
		const seBefore = entity.Player.start_travel_date.getTime() + (i * timeBetweenSmallEvents);
		const seAfter = entity.Player.start_travel_date.getTime() + ((i + 1) * timeBetweenSmallEvents);
		if (seBefore < now.getTime() && seAfter > now.getTime()) {
			for (let se of entity.Player.PlayerSmallEvents) {
				if (se.number === i) {
					return -1;
				}
			}
			return i;
		}
	}
	return -1;
};

/**
 * @type {Number} a cache variable for small events total rarity (for the random max)
 */
let totalSmallEventsRarity = null;

/**
 * Executes a small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {Number} number
 * @param {Boolean} forced
 * @returns {Promise<void>}
 */
const executeSmallEvent = async (message, language, entity, number, forced) => {

	// Pick random event
	let event;
	if (forced === null) {
		const small_events = JsonReader.small_events;
		const keys = Object.keys(small_events);
		if (totalSmallEventsRarity === null) {
			totalSmallEventsRarity = 0;
			for (let i = 0; i < keys.length; ++i) {
				totalSmallEventsRarity += small_events[keys[i]].rarity;
			}
		}
		let random_nb = randInt(1, totalSmallEventsRarity);
		let cumul = 0;
		for (let i = 0; i < keys.length; ++i) {
			cumul += small_events[keys[i]].rarity;
			if (cumul >= random_nb) {
				event = keys[i];
				break;
			}
		}
	} else {
		event = forced;
	}

	// Execute the event
	const filename = event + 'SmallEvent.js';
	try {
		const smallEventModule = require.resolve('../../core/small_events/' + filename);
		try {
			const smallEventFile = require(smallEventModule);
			if (!smallEventFile.executeSmallEvent) {
				await message.channel.send(filename + " doesn't contain an executeSmallEvent function");
			} else {
				// Create a template embed
				const seEmbed = new discord.MessageEmbed();
				seEmbed.setAuthor(format(JsonReader.commands.report.getTranslation(language).journal, {
					pseudo: message.author.username
				}), message.author.displayAvatarURL());
				seEmbed.setDescription(JsonReader.small_events[event].emote + " ");

				await smallEventFile.executeSmallEvent(message, language, entity, seEmbed);
			}
		} catch (e) {
			console.error(e);
		}
	} catch (e) {
		await message.channel.send(filename + " doesn't exist");
	}

	// Save
	PlayerSmallEvents.createPlayerSmallEvent(entity.Player.id, event, number).save();
};

/* ------------------------------------------------------------ */

module.exports = {
	commands: [
		{
			name: 'report',
			func: ReportCommand,
			aliases: ['r']
		}
	]
};