import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {giveRandomItem} from "../../core/utils/ItemUtils";
import {Entities, Entity} from "../../core/models/Entity";
import BigEvent, {BigEvents} from "../../core/models/BigEvent";
import {MapLinks} from "../../core/models/MapLink";
import {MapLocations} from "../../core/models/MapLocation";
import {Maps} from "../../core/Maps";
import {PlayerSmallEvents} from "../../core/models/PlayerSmallEvent";
import Possibility from "../../core/models/Possibility";
import {MissionsController} from "../../core/missions/MissionsController";
import {Constants} from "../../core/Constants";
import {
	hoursToMilliseconds,
	millisecondsToMinutes,
	minutesDisplay,
	parseTimeDifference
} from "../../core/utils/TimeUtils";
import {Tags} from "../../core/models/Tag";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Message, TextBasedChannel, User} from "discord.js";
import {effectsErrorTextValue, sendBlockedErrorInteraction} from "../../core/utils/ErrorUtils";
import {RandomUtils} from "../../core/utils/RandomUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {Data} from "../../core/Data";
import {SmallEvent} from "../../core/smallEvents/SmallEvent";
import {BlockingConstants} from "../../core/constants/BlockingConstants";

/**
 * Initiates a new player on the map
 * @param entity
 */
async function initiateNewPlayerOnTheAdventure(entity: Entity) {
	entity.Player.mapLinkId = Constants.BEGINNING.START_MAP_LINK;
	entity.Player.startTravelDate = new Date(Date.now() - hoursToMilliseconds((await MapLinks.getById(entity.Player.mapLinkId)).tripDuration));
	entity.Player.effect = Constants.EFFECT.SMILEY;
	await entity.Player.save();
}

const executeCommand = async (interaction: CommandInteraction, language: string, entity: Entity, forceSpecificEvent = -1, forceSmallEvent: string = null) => {
	if (entity.Player.score === 0 && entity.Player.effect === Constants.EFFECT.BABY) {
		await initiateNewPlayerOnTheAdventure(entity);
	}

	if (await sendBlockedErrorInteraction(interaction, language)) {
		return;
	}

	await MissionsController.update(entity.discordUserId, interaction.channel, language, "commandReport");

	if (!entity.Player.currentEffectFinished()) {
		return await sendTravelPath(entity, interaction, language, entity.Player.effect);
	}

	if (entity.Player.effect !== Constants.EFFECT.SMILEY && entity.Player.currentEffectFinished()) {
		await MissionsController.update(entity.discordUserId, interaction.channel, language, "recoverAlteration");
	}

	if (entity.Player.mapLinkId === null) {
		return await Maps.startTravel(entity.Player, await MapLinks.getRandomLink(), interaction.createdAt.valueOf());
	}

	if (!Maps.isTravelling(entity.Player)) {
		return await chooseDestination(entity, interaction, language, null);
	}

	if (await needBigEvent(entity)) {
		return await doRandomBigEvent(interaction, language, entity, forceSpecificEvent);
	}

	if (forceSmallEvent !== null || needSmallEvent(entity)) {
		return await executeSmallEvent(interaction, language, entity, forceSmallEvent);
	}

	return await sendTravelPath(entity, interaction, language, null);
};

/**
 * Check all missions to check when you execute a big event
 * @param entity
 * @param interaction
 * @param language
 */
async function completeMissionsBigEvent(entity: Entity, interaction: CommandInteraction, language: string) {
	await MissionsController.update(entity.discordUserId, interaction.channel, language, "travelHours", 1, {
		travelTime: await entity.Player.getCurrentTripDuration()
	});
	const endMapId = (await MapLinks.getById(entity.Player.mapLinkId)).endMap;
	await MissionsController.update(entity.discordUserId, interaction.channel, language, "goToPlace", 1, {mapId: endMapId});
	await MissionsController.update(entity.discordUserId, interaction.channel, language, "exploreDifferentPlaces", 1, {placeId: endMapId});
	await MissionsController.update(entity.discordUserId, interaction.channel, language, "fromPlaceToPlace", 1, {mapId: endMapId});
}

const doRandomBigEvent = async function(interaction: CommandInteraction, language: string, entity: Entity, forceSpecificEvent: number) {
	await completeMissionsBigEvent(entity, interaction, language);
	let time;
	const reportCommandData = Data.getModule("commands.report");
	if (forceSpecificEvent === -1) {
		time = millisecondsToMinutes(interaction.createdAt.valueOf() - entity.Player.startTravelDate.valueOf());
	}
	else {
		time = reportCommandData.getNumber("timeMaximal") + 1;
	}
	const timeLimit = reportCommandData.getNumber("timeLimit");
	if (time > timeLimit) {
		time = timeLimit;
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
			await interaction.channel.send({content: "It seems that there is no event here... It's a bug, please report it to the Draftbot staff."});
			return;
		}
	}
	else {
		event = await BigEvent.findOne({where: {id: forceSpecificEvent}});
	}
	await Maps.stopTravel(entity.Player);
	return await doEvent(interaction, language, event, entity, time);
};

/**
 * If the entity reached his destination (= big event)
 * @param {Entities} entity
 * @returns {boolean}
 */
const needBigEvent = async function(entity: Entity) {
	return await Maps.isArrived(entity.Player);
};

const sendTravelPath = async function(entity: Entity, interaction: CommandInteraction, language: string, effect: string = null) {
	const travelEmbed = new DraftBotEmbed();
	const tr = Translations.getModule("commands.report", language);
	travelEmbed.formatAuthor(tr.get("travelPathTitle"), interaction.user);
	travelEmbed.setDescription(await Maps.generateTravelPathString(entity.Player, language, effect));
	travelEmbed.addField(tr.get("startPoint"), (await entity.Player.getPreviousMap()).getDisplayName(language), true);
	travelEmbed.addField(tr.get("endPoint"), (await entity.Player.getDestination()).getDisplayName(language), true);
	if (effect !== null) {
		const errorMessageObject = await effectsErrorTextValue(interaction.user, language, entity);
		travelEmbed.addField(errorMessageObject.title, errorMessageObject.description, false);
	}
	else {
		let milisecondsBeforeSmallEvent = 0;
		if (entity.Player.PlayerSmallEvents.length !== 0) {
			const lastMiniEvent = PlayerSmallEvents.getLast(entity.Player.PlayerSmallEvents);
			const lastTime = lastMiniEvent.time > entity.Player.effectEndDate.valueOf() ? lastMiniEvent.time : entity.Player.effectEndDate.valueOf();
			milisecondsBeforeSmallEvent = lastTime + Constants.REPORT.TIME_BETWEEN_MINI_EVENTS - Date.now();
		}
		const milisecondsBeforeBigEvent = hoursToMilliseconds(await entity.Player.getCurrentTripDuration()) - Maps.getTravellingTime(entity.Player);
		if (milisecondsBeforeSmallEvent >= milisecondsBeforeBigEvent) {
			// if there is no small event before the big event, do not display anything
			travelEmbed.addField(tr.get("travellingTitle"), tr.get("travellingDescriptionEndTravel"), false);
		}
		else if (entity.Player.PlayerSmallEvents.length !== 0) {
			// the first mini event of the travel is calculated differently
			const lastMiniEvent = PlayerSmallEvents.getLast(entity.Player.PlayerSmallEvents);
			const lastTime = lastMiniEvent.time > entity.Player.effectEndDate.valueOf() ? lastMiniEvent.time : entity.Player.effectEndDate.valueOf();
			travelEmbed.addField(tr.get("travellingTitle"), tr.format("travellingDescription", {
				smallEventEmoji: Data.getModule("smallEvents." + lastMiniEvent.eventType).getString("emote"),
				time: parseTimeDifference(lastTime + Constants.REPORT.TIME_BETWEEN_MINI_EVENTS, Date.now(), language)
			}), false);
		}
		else {
			travelEmbed.addField(tr.get("travellingTitle"), tr.format("travellingDescriptionWithoutSmallEvent", {
				time: parseTimeDifference(entity.Player.startTravelDate.valueOf() + Constants.REPORT.TIME_BETWEEN_MINI_EVENTS, Date.now(), language)
			}), false);
		}
	}

	travelEmbed.addField(tr.get("collectedPointsTitle"), "🏅 " + await PlayerSmallEvents.calculateCurrentScore(entity.Player), true);

	travelEmbed.addField(tr.get("adviceTitle"), Translations.getModule("advices", language).getRandom("advices"), true);
	return await interaction.reply({embeds: [travelEmbed]});
};


const destinationChoiceEmotes = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣"];

/**
 * Creates the description for a chooseDestination embed
 * @param tr
 * @param destinationMaps
 * @param entity
 * @param language
 */
async function createDescriptionChooseDestination(tr: TranslationModule, destinationMaps: number[], entity: Entity, language: string) {
	let desc = tr.get("chooseDestinationIndications") + "\n";
	for (let i = 0; i < destinationMaps.length; ++i) {
		const map = await MapLocations.getById(destinationMaps[i]);
		const link = await MapLinks.getLinkByLocations(await entity.Player.getDestinationId(), destinationMaps[i]);
		const duration = RandomUtils.draftbotRandom.bool() ? link.tripDuration : "?";
		desc += destinationChoiceEmotes[i] + " - " + map.getDisplayName(language) + " (" + duration + "h)\n";
	}
	return desc;
}

const chooseDestination = async function(entity: Entity, interaction: CommandInteraction, language: string, restrictedMapType: string) {
	await PlayerSmallEvents.removeSmallEventsOfPlayer(entity.Player.id);
	const destinationMaps = await Maps.getNextPlayerAvailableMaps(entity.Player, restrictedMapType);

	if (destinationMaps.length === 0) {
		console.log(interaction.user + " hasn't any destination map (current map: " + await entity.Player.getDestinationId() + ", restrictedMapType: " + restrictedMapType + ")");
		return;
	}

	if (destinationMaps.length === 1 || RandomUtils.draftbotRandom.bool(1, 3) && entity.Player.mapLinkId !== Constants.BEGINNING.LAST_MAP_LINK) {
		const newLink = await MapLinks.getLinkByLocations(await entity.Player.getDestinationId(), destinationMaps[0]);
		await Maps.startTravel(entity.Player, newLink, interaction.createdAt.valueOf());
		await destinationChoseMessage(entity, destinationMaps[0], interaction.user, interaction.channel, language);
		return;
	}

	const tr = Translations.getModule("commands.report", language);
	const chooseDestinationEmbed = new DraftBotEmbed();
	chooseDestinationEmbed.formatAuthor(tr.get("destinationTitle"), interaction.user);
	chooseDestinationEmbed.setDescription(await createDescriptionChooseDestination(tr, destinationMaps, entity, language));

	const sentMessage = await interaction.channel.send({embeds: [chooseDestinationEmbed]});

	const collector = sentMessage.createReactionCollector({
		filter: (reaction, user) => destinationChoiceEmotes.indexOf(reaction.emoji.name) !== -1 && user.id === interaction.user.id,
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.CHOOSE_DESTINATION, collector);

	collector.on("collect", () => {
		collector.stop();
	});

	collector.on("end", async (collected) => {
		const mapId = collected.first() ? destinationMaps[destinationChoiceEmotes.indexOf(collected.first().emoji.name)] : destinationMaps[RandomUtils.randInt(0, destinationMaps.length)];
		const newLink = await MapLinks.getLinkByLocations(await entity.Player.getDestinationId(), mapId);
		await Maps.startTravel(entity.Player, newLink, interaction.createdAt.valueOf());
		await destinationChoseMessage(entity, mapId, interaction.user, interaction.channel, language);
		BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.CHOOSE_DESTINATION);
	});

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
 * @param user
 * @param channel
 * @param language
 * @returns {Promise<void>}
 */
const destinationChoseMessage = async function(entity: Entity, map: number, user: User, channel: TextBasedChannel, language: string) {
	const tr = Translations.getModule("commands.report", language);
	const typeTr = Translations.getModule("models.maps", language);
	const mapInstance = await MapLocations.getById(map);
	const destinationEmbed = new DraftBotEmbed();
	destinationEmbed.formatAuthor(tr.get("destinationTitle"), user);
	const tripDuration = await entity.Player.getCurrentTripDuration();
	if (tripDuration < 1) {
		destinationEmbed.setDescription(tr.format("choseMapMinutes", {
			mapPrefix: typeTr.get("types." + mapInstance.type + ".prefix"),
			mapName: mapInstance.getDisplayName(language),
			mapType: typeTr.get("types." + mapInstance.type + ".name").toLowerCase(),
			time: Math.round(tripDuration * 60)
		}));
	}
	else {
		destinationEmbed.setDescription(tr.format("choseMap", {
			mapPrefix: typeTr.get("types." + mapInstance.type + ".prefix"),
			mapName: mapInstance.getDisplayName(language),
			mapType: typeTr.get("types." + mapInstance.type + ".name").toLowerCase(),
			time: tripDuration
		}));
	}
	await channel.send({embeds: [destinationEmbed]});
};

/**
 * @param {CommandInteraction} interaction - Interaction from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {BigEvent} event
 * @param {Entities} entity
 * @param {Number} time
 * @param {Number} forcePoints Force a certain number of points to be given instead of random
 * @return {Promise<void>}
 */
const doEvent = async (interaction: CommandInteraction, language: string, event: BigEvent, entity: Entity, time: number, forcePoints = 0) => {
	const eventDisplayed = await interaction.reply({
		content: Translations.getModule("commands.report", language).format("doEvent", {
			pseudo: interaction.user,
			event: event.getText(language)
		}),
		fetchReply: true
	}) as Message;
	const reactions = await event.getReactions();
	const collector = eventDisplayed.createReactionCollector({
		filter: (reaction, user) => reactions.indexOf(reaction.emoji.name) !== -1 && user.id === interaction.user.id,
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.REPORT, collector);

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
		await doPossibility(interaction, language, possibility, entity, time, forcePoints);
	});

	collector.on("end", async (collected) => {
		if (!collected.first() || collected.firstKey() === Constants.REPORT.QUICK_END_EMOTE) {
			const possibility = await Possibility.findAll({
				where: {
					eventId: event.id,
					possibilityKey: "end"
				}
			});
			await doPossibility(interaction, language, possibility, entity, time, forcePoints);
		}
	});
	for (const reaction of reactions) {
		if (reaction !== "end" && reaction !== Constants.REPORT.QUICK_END_EMOTE) {
			await eventDisplayed.react(reaction)
				.catch();
		}
	}
};

/**
 * @param {CommandInteraction} interaction - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Possibility} possibility
 * @param {Entities} entity
 * @param {Number} time
 * @param {Number} forcePoints Force a certain number of points to be given instead of random
 * @return {Promise<CommandInteraction>}
 */
const doPossibility = async (interaction: CommandInteraction, language: string, possibility: Possibility[], entity: Entity, time: number, forcePoints = 0) => {
	[entity] = await Entities.getOrRegister(entity.discordUserId);
	const player = entity.Player;
	const tr = Translations.getModule("commands.report", language);

	if (possibility.length === 1) { // Don't do anything if the player ends the first report
		if (possibility[0].eventId === 0 && possibility[0].possibilityKey === "end") {
			BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.REPORT);
			return await interaction.reply({
				content: tr.format("doPossibility", {
					pseudo: interaction.user,
					result: "",
					event: possibility[0].getText(language),
					emoji: "",
					alte: ""
				})
			});
		}
	}

	const randomPossibility = RandomUtils.draftbotRandom.pick(possibility);
	let scoreChange;
	if (forcePoints !== 0) {
		scoreChange = forcePoints;
	}
	else {
		scoreChange = time + RandomUtils.draftbotRandom.integer(0, time / Constants.REPORT.BONUS_POINT_TIME_DIVIDER) + await PlayerSmallEvents.calculateCurrentScore(entity.Player);
	}
	let moneyChange = randomPossibility.money + Math.round(time / 10 + RandomUtils.draftbotRandom.integer(0, time / 10 + player.level / 5 - 1));
	if (randomPossibility.money < 0 && moneyChange > 0) {
		moneyChange = Math.round(randomPossibility.money / 2);
	}
	let result = "";
	result += tr.format("points", {score: scoreChange});
	if (moneyChange !== 0) {
		result += moneyChange >= 0
			? tr.format("money", {money: moneyChange})
			: tr.format("moneyLoose", {money: -moneyChange});
	}
	if (randomPossibility.experience > 0) {
		result += tr.format("experience", {experience: randomPossibility.experience});
	}
	if (randomPossibility.health < 0) {
		result += tr.format("healthLoose", {health: -randomPossibility.health});
	}
	if (randomPossibility.health > 0) {
		result += tr.format("health", {health: randomPossibility.health});
	}
	if (randomPossibility.lostTime > 0 && randomPossibility.effect === ":clock2:") {
		result += tr.format("timeLost", {timeLost: minutesDisplay(randomPossibility.lostTime)});
	}
	let emojiEnd = randomPossibility.effect !== Constants.EFFECT.SMILEY && randomPossibility.effect !== Constants.EFFECT.OCCUPIED ? " " + randomPossibility.effect : "";

	emojiEnd = randomPossibility.oneshot === true ? " " + Constants.EFFECT.DEAD + " " : emojiEnd;

	if (randomPossibility.possibilityKey === "end") {
		result = tr.format("doPossibility", {
			pseudo: interaction.user,
			result: result,
			event: randomPossibility.getText(language),
			emoji: "",
			alte: emojiEnd
		});
	}
	else {
		result = tr.format("doPossibility", {
			pseudo: interaction.user,
			result: result,
			event: randomPossibility.getText(language),
			emoji: randomPossibility.possibilityKey + " ",
			alte: emojiEnd
		});
	}

	await entity.addHealth(randomPossibility.health, interaction.channel, language);
	await player.addScore(entity, scoreChange, interaction.channel, language);
	await player.addMoney(entity, moneyChange, interaction.channel, language);
	await player.addExperience(randomPossibility.experience, entity, interaction.channel, language);

	if (randomPossibility.nextEvent !== undefined) {
		player.nextEvent = randomPossibility.nextEvent;
	}

	await player.setLastReportWithEffect(
		randomPossibility.eventId === 0 ? 0 : interaction.createdTimestamp,
		randomPossibility.lostTime,
		randomPossibility.effect
	);
	if (randomPossibility.item) {
		await giveRandomItem((await interaction.guild.members.fetch(entity.discordUserId)).user, interaction.channel, language, entity);
	}

	if (randomPossibility.oneshot) {
		await entity.setHealth(0, interaction.channel, language);
	}

	if (randomPossibility.eventId === 0) {
		player.money = 0;
		player.score = 0;
		if (randomPossibility.possibilityKey !== "end") {
			player.money = 10;
			player.score = 100;
		}
	}

	BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.REPORT);
	const resultMsg = await interaction.channel.send({content: result});

	if (!await player.killIfNeeded(entity, interaction.channel, language)) {
		await chooseDestination(entity, interaction, language, randomPossibility.restrictedMaps);
	}

	await MissionsController.update(entity.discordUserId, interaction.channel, language, "doReports");
	const tagsToVerify = (await Tags.findTagsFromObject(randomPossibility.id, Possibility.name)).concat(await Tags.findTagsFromObject(randomPossibility.eventId, BigEvent.name));
	if (tagsToVerify) {
		for (let i = 0; i < tagsToVerify.length; i++) {
			await MissionsController.update(entity.discordUserId, interaction.channel, language, tagsToVerify[i].textTag, 1, {tags: tagsToVerify});
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
const needSmallEvent = function(entity: Entity) {
	if (entity.Player.PlayerSmallEvents.length !== 0) {
		const lastMiniEvent = PlayerSmallEvents.getLast(entity.Player.PlayerSmallEvents);
		const lastTime = lastMiniEvent.time > entity.Player.startTravelDate.valueOf() ? lastMiniEvent.time : entity.Player.startTravelDate.valueOf();
		return Date.now() >= lastTime + Constants.REPORT.TIME_BETWEEN_MINI_EVENTS;
	}
	return Date.now() >= entity.Player.startTravelDate.valueOf() + Constants.REPORT.TIME_BETWEEN_MINI_EVENTS;
};

const executeSmallEvent = async (interaction: CommandInteraction, language: string, entity: Entity, forced: string) => {

	// Pick random event
	let event: string;
	if (forced === null) {
		const keys = Data.getKeys("smallEvents");
		let totalSmallEventsRarity = 0;
		const updatedKeys = [];
		for (let i = 0; i < keys.length; ++i) {
			const file = require(require.resolve("../../core/smallEvents/" + keys[i] + "SmallEvent.js"));
			if (!file.smallEvent || !file.smallEvent.canBeExecuted) {
				await interaction.reply({content: keys[i] + " doesn't contain a canBeExecuted function"});
				return;
			}
			if (await file.smallEvent.canBeExecuted(entity)) {
				updatedKeys.push(keys[i]);
				totalSmallEventsRarity += Data.getModule("smallEvents." + keys[i]).getNumber("rarity");
			}
		}
		const randomNb = RandomUtils.randInt(1, totalSmallEventsRarity);
		let cumul = 0;
		for (let i = 0; i < updatedKeys.length; ++i) {
			cumul += Data.getModule("smallEvents." + updatedKeys[i]).getNumber("rarity");
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
			const smallEvent: SmallEvent = require(smallEventModule).smallEvent;
			if (!smallEvent.executeSmallEvent) {
				await interaction.reply({content: filename + " doesn't contain an executeSmallEvent function"});
			}
			else {
				// Create a template embed
				const seEmbed = new DraftBotEmbed()
					.formatAuthor(Translations.getModule("commands.report", language).get("journal"), interaction.user)
					.setDescription(Data.getModule("smallEvents." + event).getString("emote"));

				await smallEvent.executeSmallEvent(interaction, language, entity, seEmbed);

				await MissionsController.update(entity.discordUserId, interaction.channel, language, "doReports");
			}
		}
		catch (e) {
			console.error(e);
		}
	}
	catch (e) {
		await interaction.reply({content: filename + " doesn't exist"});
	}

	// Save
	await PlayerSmallEvents.createPlayerSmallEvent(entity.Player.id, event, Date.now()).save();
};

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("report")
		.setDescription("Make a report"),
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};
