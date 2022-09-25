import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entities, Entity} from "../../core/database/game/models/Entity";
import BigEvent, {BigEvents} from "../../core/database/game/models/BigEvent";
import {MapLinks} from "../../core/database/game/models/MapLink";
import {MapLocations} from "../../core/database/game/models/MapLocation";
import {Maps} from "../../core/Maps";
import {PlayerSmallEvents} from "../../core/database/game/models/PlayerSmallEvent";
import Possibility from "../../core/database/game/models/Possibility";
import {MissionsController} from "../../core/missions/MissionsController";
import {Constants} from "../../core/Constants";
import {
	hoursToMilliseconds,
	millisecondsToMinutes,
	minutesDisplay,
	parseTimeDifference
} from "../../core/utils/TimeUtils";
import {Tags} from "../../core/database/game/models/Tag";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Message} from "discord.js";
import {effectsErrorTextValue} from "../../core/utils/ErrorUtils";
import {RandomUtils} from "../../core/utils/RandomUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {Data} from "../../core/Data";
import {SmallEvent} from "../../core/smallEvents/SmallEvent";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {giveRandomItem} from "../../core/utils/ItemUtils";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {ReportConstants} from "../../core/constants/ReportConstants";

type TextInformation = { interaction: CommandInteraction, language: string, tr?: TranslationModule }

/**
 * Initiates a new player on the map
 * @param entity
 */
async function initiateNewPlayerOnTheAdventure(entity: Entity): Promise<void> {
	entity.Player.mapLinkId = Constants.BEGINNING.START_MAP_LINK;
	entity.Player.startTravelDate = new Date(Date.now() - hoursToMilliseconds((await MapLinks.getById(entity.Player.mapLinkId)).tripDuration));
	entity.Player.effect = EffectsConstants.EMOJI_TEXT.SMILEY;
	await entity.Player.save();
}

/* ---------------------------------------------------------------
SMALL EVENTS FUNCTIONS
--------------------------------------------------------------- */

/**
 * Returns if the entity reached a stopping point (= small event)
 * @param {Entities} entity
 * @returns {boolean}
 */
function needSmallEvent(entity: Entity): boolean {
	if (entity.Player.PlayerSmallEvents.length !== 0) {
		const lastMiniEvent = PlayerSmallEvents.getLast(entity.Player.PlayerSmallEvents);
		const lastTime = lastMiniEvent.time > entity.Player.effectEndDate.valueOf() ? lastMiniEvent.time : entity.Player.effectEndDate.valueOf();
		return Date.now() >= lastTime + Constants.REPORT.TIME_BETWEEN_MINI_EVENTS;
	}
	return Date.now() >= entity.Player.startTravelDate.valueOf() + Constants.REPORT.TIME_BETWEEN_MINI_EVENTS;
}

/**
 * Executes a small event
 * @param interaction
 * @param language
 * @param entity
 * @param forced
 */
async function executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, forced: string): Promise<void> {
	// Pick random event
	let event: string;
	if (forced === null) {
		const keys = Data.getKeys("smallEvents");
		let totalSmallEventsRarity = 0;
		const updatedKeys = [];
		for (let i = 0; i < keys.length; ++i) {
			const file = await import(`../../core/smallEvents/${keys[i]}SmallEvent.js`);
			if (!file.smallEvent || !file.smallEvent.canBeExecuted) {
				await interaction.reply({content: `${keys[i]} doesn't contain a canBeExecuted function`});
				return;
			}
			if (await file.smallEvent.canBeExecuted(entity)) {
				updatedKeys.push(keys[i]);
				totalSmallEventsRarity += Data.getModule(`smallEvents.${keys[i]}`).getNumber("rarity");
			}
		}
		const randomNb = RandomUtils.randInt(1, totalSmallEventsRarity);
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

			draftBotInstance.logsDatabase.logSmallEvent(entity.discordUserId, event).then();
			await smallEvent.executeSmallEvent(interaction, language, entity, seEmbed);

			await MissionsController.update(entity, interaction.channel, language, {missionId: "doReports"});
		}
		catch (e) {
			console.error(e);
		}
	}
	catch (e) {
		await interaction.reply({content: `${filename} doesn't exist`});
	}

	// Save
	await PlayerSmallEvents.createPlayerSmallEvent(entity.Player.id, event, Date.now()).save();
}

/**
 * Check all missions to check when you execute a big event
 * @param entity
 * @param interaction
 * @param language
 */
async function completeMissionsBigEvent(entity: Entity, interaction: CommandInteraction, language: string): Promise<void> {
	await MissionsController.update(entity, interaction.channel, language, {
		missionId: "travelHours", params: {
			travelTime: await entity.Player.getCurrentTripDuration()
		}
	});
	const endMapId = (await MapLinks.getById(entity.Player.mapLinkId)).endMap;
	await MissionsController.update(entity, interaction.channel, language, {
		missionId: "goToPlace",
		params: {mapId: endMapId}
	});
	await MissionsController.update(entity, interaction.channel, language, {
		missionId: "exploreDifferentPlaces",
		params: {placeId: endMapId}
	});
	await MissionsController.update(entity, interaction.channel, language, {
		missionId: "fromPlaceToPlace",
		params: {mapId: endMapId}
	});
}

/**
 * If the entity reached his destination (= big event)
 * @param {Entities} entity
 * @returns {boolean}
 */
async function needBigEvent(entity: Entity): Promise<boolean> {
	return await Maps.isArrived(entity.Player);
}

/**
 * Send where the player is currently staying on the road
 * @param entity
 * @param interaction
 * @param language
 * @param effect
 */
async function sendTravelPath(entity: Entity, interaction: CommandInteraction, language: string, effect: string = null): Promise<void> {
	const travelEmbed = new DraftBotEmbed();
	const tr = Translations.getModule("commands.report", language);
	travelEmbed.formatAuthor(tr.get("travelPathTitle"), interaction.user);
	travelEmbed.setDescription(await Maps.generateTravelPathString(entity.Player, language, effect));
	travelEmbed.addFields({
		name: tr.get("startPoint"),
		value: (await entity.Player.getPreviousMap()).getDisplayName(language),
		inline: true
	});
	travelEmbed.addFields({
		name: tr.get("endPoint"),
		value: (await entity.Player.getDestination()).getDisplayName(language),
		inline: true
	});
	if (effect !== null) {
		const errorMessageObject = await effectsErrorTextValue(interaction.user, language, entity);
		travelEmbed.addFields({
			name: errorMessageObject.title,
			value: errorMessageObject.description,
			inline: false
		});
	}
	else {
		let millisecondsBeforeSmallEvent = Constants.REPORT.TIME_BETWEEN_MINI_EVENTS;
		if (entity.Player.PlayerSmallEvents.length !== 0) {
			const lastMiniEvent = PlayerSmallEvents.getLast(entity.Player.PlayerSmallEvents);
			const lastTime = lastMiniEvent.time > entity.Player.effectEndDate.valueOf() ? lastMiniEvent.time : entity.Player.effectEndDate.valueOf();
			millisecondsBeforeSmallEvent += lastTime - Date.now();
		}
		const millisecondsBeforeBigEvent = hoursToMilliseconds(await entity.Player.getCurrentTripDuration()) - Maps.getTravellingTime(entity.Player);
		if (millisecondsBeforeSmallEvent >= millisecondsBeforeBigEvent) {
			// if there is no small event before the big event, do not display anything
			travelEmbed.addFields({
				name: tr.get("travellingTitle"),
				value: tr.get("travellingDescriptionEndTravel")
			});
		}
		else if (entity.Player.PlayerSmallEvents.length !== 0) {
			// the first mini event of the travel is calculated differently
			const lastMiniEvent = PlayerSmallEvents.getLast(entity.Player.PlayerSmallEvents);
			const lastTime = lastMiniEvent.time > entity.Player.effectEndDate.valueOf() ? lastMiniEvent.time : entity.Player.effectEndDate.valueOf();
			travelEmbed.addFields({
				name: tr.get("travellingTitle"),
				value: tr.format("travellingDescription", {
					smallEventEmoji: Data.getModule(`smallEvents.${lastMiniEvent.eventType}`).getString("emote"),
					time: parseTimeDifference(lastTime + Constants.REPORT.TIME_BETWEEN_MINI_EVENTS, Date.now(), language)
				})
			});
		}
		else {
			travelEmbed.addFields({
				name: tr.get("travellingTitle"),
				value: tr.format("travellingDescriptionWithoutSmallEvent", {
					time: parseTimeDifference(entity.Player.startTravelDate.valueOf() + Constants.REPORT.TIME_BETWEEN_MINI_EVENTS, Date.now(), language)
				})
			});
		}
	}

	travelEmbed.addFields({
		name: tr.get("collectedPointsTitle"),
		value: `🏅 ${await PlayerSmallEvents.calculateCurrentScore(entity.Player)}`,
		inline: true
	});

	travelEmbed.addFields({
		name: tr.get("adviceTitle"),
		value: Translations.getModule("advices", language).getRandom("advices"),
		inline: true
	});
	await interaction.reply({embeds: [travelEmbed]});
}

const destinationChoiceEmotes = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣"];

/**
 * Creates the description for a chooseDestination embed
 * @param tr
 * @param destinationMaps
 * @param entity
 * @param language
 */
async function createDescriptionChooseDestination(
	tr: TranslationModule,
	destinationMaps: number[],
	entity: Entity,
	language: string
): Promise<string> {
	let desc = tr.get("chooseDestinationIndications") + "\n";
	for (let i = 0; i < destinationMaps.length; ++i) {
		const map = await MapLocations.getById(destinationMaps[i]);
		const link = await MapLinks.getLinkByLocations(await entity.Player.getDestinationId(), destinationMaps[i]);
		const duration = RandomUtils.draftbotRandom.bool() ? link.tripDuration : "?";
		desc += `${destinationChoiceEmotes[i]} - ${map.getDisplayName(language)} (${duration}h)\n`;
	}
	return desc;
}


/**
 * Function called to display the direction chosen by a player
 * @param entity
 * @param map
 * @param interaction
 * @param language
 * @returns {Promise<void>}
 */
async function destinationChoseMessage(
	entity: Entity,
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
	const tripDuration = await entity.Player.getCurrentTripDuration();
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
 * @param entity
 * @param interaction
 * @param language
 * @param restrictedMapType
 */
async function chooseDestination(
	entity: Entity,
	interaction: CommandInteraction,
	language: string,
	restrictedMapType: string
): Promise<void> {
	await PlayerSmallEvents.removeSmallEventsOfPlayer(entity.Player.id);
	const destinationMaps = await Maps.getNextPlayerAvailableMaps(entity.Player, restrictedMapType);

	if (destinationMaps.length === 0) {
		console.log(`${interaction.user} hasn't any destination map (current map: ${await entity.Player.getDestinationId()}, restrictedMapType: ${restrictedMapType})`);
		return;
	}

	if (destinationMaps.length === 1 || RandomUtils.draftbotRandom.bool(1, 3) && entity.Player.mapLinkId !== Constants.BEGINNING.LAST_MAP_LINK) {
		const newLink = await MapLinks.getLinkByLocations(await entity.Player.getDestinationId(), destinationMaps[0]);
		await Maps.startTravel(entity.Player, newLink, interaction.createdAt.valueOf(), NumberChangeReason.BIG_EVENT);
		await destinationChoseMessage(entity, destinationMaps[0], interaction, language);
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
		await Maps.startTravel(entity.Player, newLink, interaction.createdAt.valueOf(), NumberChangeReason.BIG_EVENT);
		await destinationChoseMessage(entity, mapId, interaction, language);
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
}

/**
 * Updates the player's information depending on the random possibility drawn
 * @param entity
 * @param randomPossibility
 * @param textInformation
 * @param changes
 */
async function updatePlayerInfos(
	entity: Entity,
	randomPossibility: Possibility,
	textInformation: TextInformation,
	changes: { scoreChange: number, moneyChange: number }
): Promise<void> {
	await entity.addHealth(randomPossibility.health, textInformation.interaction.channel, textInformation.language, NumberChangeReason.BIG_EVENT);
	const valuesToEditParameters = {
		entity,
		channel: textInformation.interaction.channel,
		language: textInformation.language,
		reason: NumberChangeReason.BIG_EVENT
	};
	await entity.Player.addScore(Object.assign(valuesToEditParameters, {amount: changes.scoreChange}));
	await entity.Player.addMoney(Object.assign(valuesToEditParameters, {amount: changes.moneyChange}));
	await entity.Player.addExperience(Object.assign(valuesToEditParameters, {amount: randomPossibility.experience}));

	if (randomPossibility.nextEvent !== undefined) {
		entity.Player.nextEvent = randomPossibility.nextEvent;
	}

	await entity.Player.setLastReportWithEffect(
		randomPossibility.lostTime,
		randomPossibility.effect
	);
	if (randomPossibility.item) {
		await giveRandomItem((await textInformation.interaction.guild.members.fetch(entity.discordUserId)).user, textInformation.interaction.channel, textInformation.language, entity);
	}

	if (randomPossibility.oneshot) {
		await entity.addHealth(-entity.health, textInformation.interaction.channel, textInformation.language, NumberChangeReason.BIG_EVENT);
	}

	if (randomPossibility.eventId === 0) {
		await entity.Player.addMoney({
			entity,
			amount: -entity.Player.money,
			channel: textInformation.interaction.channel,
			language: textInformation.language,
			reason: NumberChangeReason.BIG_EVENT
		});
		await entity.Player.addScore({
			entity: entity,
			amount: -entity.Player.score,
			channel: textInformation.interaction.channel,
			language: textInformation.language,
			reason: NumberChangeReason.BIG_EVENT
		});
		if (randomPossibility.possibilityKey !== "end") {
			await entity.Player.addMoney({
				entity,
				amount: 10 - entity.Player.money,
				channel: textInformation.interaction.channel,
				language: textInformation.language,
				reason: NumberChangeReason.BIG_EVENT
			});
			await entity.Player.addScore({
				entity: entity,
				amount: 100 - entity.Player.score,
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
 * @param entity
 * @param randomPossibility
 */
async function getChanges(time: number, entity: Entity, randomPossibility: Possibility): Promise<{ scoreChange: number, moneyChange: number }> {
	const scoreChange = time + RandomUtils.draftbotRandom.integer(0, time / Constants.REPORT.BONUS_POINT_TIME_DIVIDER) + await PlayerSmallEvents.calculateCurrentScore(entity.Player);
	let moneyChange = randomPossibility.money + Math.round(time / 10 + RandomUtils.draftbotRandom.integer(0, time / 10 + entity.Player.level / 5 - 1));
	if (randomPossibility.money < 0 && moneyChange > 0) {
		moneyChange = Math.round(randomPossibility.money / 2);
	}
	return {scoreChange, moneyChange};
}

/**
 * Get the description of the drawn possibility and update the player
 * @param time
 * @param entity
 * @param randomPossibility
 * @param textInformation
 */
async function getDescriptionPossibilityResult(
	time: number,
	entity: Entity,
	randomPossibility: Possibility,
	textInformation: TextInformation
): Promise<string> {
	const changes = await getChanges(time, entity, randomPossibility);
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

	await updatePlayerInfos(entity, randomPossibility, textInformation, changes);

	return textInformation.tr.format("doPossibility", {
		pseudo: textInformation.interaction.user,
		result: result,
		event: randomPossibility.getText(textInformation.language),
		emoji: randomPossibility.possibilityKey === "end" ? "" : `${randomPossibility.possibilityKey} `,
		alte: emojiEnd
	});
}

/**
 * @param textInformation
 * @param {Possibility} possibility
 * @param {Entities} entity
 * @param {Number} time
 * @return {Promise<CommandInteraction>}
 */
async function doPossibility(
	textInformation: TextInformation,
	possibility: Possibility[],
	entity: Entity,
	time: number
): Promise<Message> {
	[entity] = await Entities.getOrRegister(entity.discordUserId);
	const player = entity.Player;
	textInformation.tr = Translations.getModule("commands.report", textInformation.language);

	if (possibility[0].eventId === 0 && possibility[0].possibilityKey === "end") { // Don't do anything if the player ends the first report
		draftBotInstance.logsDatabase.logBigEvent(entity.discordUserId, possibility[0].eventId, possibility[0].possibilityKey, 0).then();
		BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.REPORT);
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
	draftBotInstance.logsDatabase.logBigEvent(entity.discordUserId, randomPossibility.eventId, randomPossibility.possibilityKey, randomPossibilityIndex).then();
	const result = await getDescriptionPossibilityResult(time, entity, randomPossibility, textInformation);

	BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.REPORT);
	const resultMsg = await textInformation.interaction.channel.send({content: result});

	if (!await player.killIfNeeded(entity, textInformation.interaction.channel, textInformation.language, NumberChangeReason.BIG_EVENT)) {
		await chooseDestination(entity, textInformation.interaction, textInformation.language, randomPossibility.restrictedMaps);
	}

	await MissionsController.update(entity, textInformation.interaction.channel, textInformation.language, {missionId: "doReports"});
	const tagsToVerify = (await Tags.findTagsFromObject(randomPossibility.id, Possibility.name)).concat(await Tags.findTagsFromObject(randomPossibility.eventId, BigEvent.name));
	if (tagsToVerify) {
		for (let i = 0; i < tagsToVerify.length; i++) {
			await MissionsController.update(entity, textInformation.interaction.channel, textInformation.language, {
				missionId: tagsToVerify[i].textTag,
				params: {tags: tagsToVerify}
			});
		}
	}
	await entity.save();
	await player.save();
	return resultMsg;
}

/**
 * @param textInformation
 * @param {BigEvent} event
 * @param {Entities} entity
 * @param {Number} time
 * @return {Promise<void>}
 */
async function doEvent(textInformation: TextInformation, event: BigEvent, entity: Entity, time: number): Promise<void> {
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
		await doPossibility(textInformation, possibility, entity, time);
	});

	collector.on("end", async (collected) => {
		if (!collected.first() || collected.firstKey() === Constants.REPORT.QUICK_END_EMOTE) {
			const possibility = await Possibility.findAll({
				where: {
					eventId: event.id,
					possibilityKey: "end"
				}
			});
			await doPossibility(textInformation, possibility, entity, time);
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
 * @param entity
 * @param forceSpecificEvent
 */
async function doRandomBigEvent(
	interaction: CommandInteraction,
	language: string,
	entity: Entity,
	forceSpecificEvent: number
): Promise<void> {
	await interaction.deferReply();
	await completeMissionsBigEvent(entity, interaction, language);
	let time = forceSpecificEvent
		? ReportConstants.TIME_MAXIMAL + 1
		: millisecondsToMinutes(interaction.createdAt.valueOf() - entity.Player.startTravelDate.valueOf());
	if (time > ReportConstants.TIME_LIMIT) {
		time = ReportConstants.TIME_LIMIT;
	}

	let event;

	// nextEvent is defined ?
	if (entity.Player.nextEvent !== undefined && entity.Player.nextEvent !== null) {
		forceSpecificEvent = entity.Player.nextEvent;
	}

	if (forceSpecificEvent === -1 || !forceSpecificEvent) {
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
	return await doEvent({interaction, language}, event, entity, time);
}

/**
 * The main command of the bot : makes the player progress in the adventure
 * @param interaction
 * @param language
 * @param entity
 * @param forceSpecificEvent
 * @param forceSmallEvent
 */
async function executeCommand(
	interaction: CommandInteraction,
	language: string,
	entity: Entity,
	forceSpecificEvent: number = null,
	forceSmallEvent: string = null
): Promise<void> {
	if (entity.Player.score === 0 && entity.Player.effect === EffectsConstants.EMOJI_TEXT.BABY) {
		await initiateNewPlayerOnTheAdventure(entity);
	}

	if (await sendBlockedError(interaction, language)) {
		return;
	}

	await MissionsController.update(entity, interaction.channel, language, {missionId: "commandReport"});

	if (forceSpecificEvent || await needBigEvent(entity)) {
		return await doRandomBigEvent(interaction, language, entity, forceSpecificEvent);
	}

	if (forceSmallEvent || needSmallEvent(entity)) {
		return await executeSmallEvent(interaction, language, entity, forceSmallEvent);
	}

	if (!entity.Player.currentEffectFinished()) {
		return await sendTravelPath(entity, interaction, language, entity.Player.effect);
	}

	if (entity.Player.effect !== EffectsConstants.EMOJI_TEXT.SMILEY && entity.Player.currentEffectFinished()) {
		await MissionsController.update(entity, interaction.channel, language, {missionId: "recoverAlteration"});
	}

	if (entity.Player.mapLinkId === null) {
		return await Maps.startTravel(entity.Player, await MapLinks.getRandomLink(), interaction.createdAt.valueOf(), NumberChangeReason.DEBUG);
	}

	if (!Maps.isTravelling(entity.Player)) {
		return await chooseDestination(entity, interaction, language, null);
	}

	return await sendTravelPath(entity, interaction, language, null);
}

const currentCommandFrenchTranslations = Translations.getModule("commands.report", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.report", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName(currentCommandEnglishTranslations.get("commandName"))
		.setNameLocalizations({
			fr: currentCommandFrenchTranslations.get("commandName")
		})
		.setDescription(currentCommandEnglishTranslations.get("commandDescription"))
		.setDescriptionLocalizations({
			fr: currentCommandFrenchTranslations.get("commandDescription")
		}),
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};