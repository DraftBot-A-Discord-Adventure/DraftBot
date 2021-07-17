import {DraftBotErrorEmbed} from "./messages/DraftBotErrorEmbed";
import {DraftBotEmbed} from "./messages/DraftBotEmbed";

global.draftbotRandom = new (require("random-js")).Random();

/**
 * @typedef {import('sequelize/types')} DataTypes
 * Convert a discord id into a discord mention
 * @param {Number} id - The role/user id
 */
global.idToMention = (id) => "<@&" + id + ">";

/**
 * Get the id from a mention
 * @param {any} variable
 * @return {String} The id of the mention
 */
global.getIdFromMention = (variable) => {
	if (typeof variable === "string") {
		return variable.slice(3, variable.length - 1);
	}
	return "";
};

/**
 * Check if the given variable is a Mention
 * @param {String} variable
 * @return {boolean}
 */
global.isAMention = (variable) => {
	if (typeof variable === "string") {
		return RegExp(/^<@!?[0-9]{18}>$/).test(variable);
	}
	return false;
};

/**
 * Check if the given variable is a Discord Emoji
 * @param {String} variable
 * @return {boolean}
 */
global.isAnEmoji = (variable) => RegExp(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi).test(variable);

module.exports = {
	isAMention: isAMention,
	isAnEmoji: isAnEmoji
};

/**
 * Send all attachments from a message to a discord channel
 * @param {module:"discord.js".Message} message - Message from the discord user
 * @param {module:"discord.js".TextChannel} channel - The channel where all attachments will be sent
 */
global.sendMessageAttachments = (message, channel) => {
	message.attachments.forEach((element) => {
		channel.send({
			files: [{
				attachment: element.url,
				name: element.filename
			}]
		});
	});
};

/**
 * Send an error in a channel
 * @param {module:"discord.js".User} user
 * @param {module:"discord.js".TextChannel} channel
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {boolean} isCancelling - true if the error message is meant to cancel something
 * @param {String} reason
 */
global.sendErrorMessage = (user, channel, language, reason, isCancelling = false) => channel.send(new DraftBotErrorEmbed(user, language, reason, isCancelling));

/**
 * Send a dm to a user
 * @param {module:"discord.js".User} user
 * @param {String} title - Title of the DM, title must be of format "*{pseudo}*"
 * @param {String} description - Description of the DM
 * @param {module:"discord.js".color} color - Color of the DM
 * @param {("fr"|"en")} language - Language to use in the response
 */
global.sendDirectMessage = (user, title, description, color, language) => {
	try {
		user.send(new DraftBotEmbed()
			.setColor(color)
			.formatAuthor(title, user)
			.setDescription(description)
			.setFooter(JsonReader.models.players.getTranslation(language).dmEnabledFooter));
		log("Dm sent to " + user.id + ", title : " + title + ", description : " + description);
	}
	catch (err) {
		log("user" + user.id + "has closed dms !");
	}
};


/**
 * Send a simple message in a channel
 * @param {module:"discord.js".User} user
 * @param {module:"discord.js".TextChannel} channel
 * @param {String} title - the title of the message
 * @param {String} message - the message
 */
global.sendSimpleMessage = (user, channel, title, message) => channel.send(new DraftBotEmbed()
	.formatAuthor(title, user)
	.setDescription(message));

/**
 * Give an item to a user
 * @param {module:"discord.js".User} discordUser
 * @param {Item} item - The item that has to be given
 * @param {module:"discord.js".TextChannel} channel
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Entity} entity
 * @param {Integer} resaleMultiplierNew
 * @param {Integer} resaleMultiplierActual
 * @returns {Promise<*>}
 */
global.giveItem = async (entity, item, language, discordUser, channel, resaleMultiplierNew = 1, resaleMultiplierActual = 1) => { // eslint-disable-line max-params
	log(entity.discordUserId + " found the item " + item.getName("en") + "; value: " + getItemValue(item));
	let autoSell = false;
	let autoReplace = false;
	let resaleMultiplier = resaleMultiplierNew;
	const embed = new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.inventory.getTranslation(language).randomItemFooter, discordUser);
	const receivedEmbed = new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.inventory.getTranslation(language).randomItemTitle, discordUser)
		.setDescription(item.toString(language));

	if (item instanceof Potions) {
		const potion = await entity.Player.Inventory.getPotion();
		if (potion.id === item.id) {
			autoSell = true;
		}
		if (potion.rarity === 0) {
			autoReplace = true;
		}
		embed.setAuthor(format(JsonReader.commands.inventory.getTranslation(language).randomItemFooterPotion, {
			pseudo: discordUser.username
		}), discordUser.displayAvatarURL());
		embed.setDescription(format(JsonReader.commands.inventory.getTranslation(language).randomItemDesc, {
			actualItem: potion.toString(language)
		}));
	}
	if (item instanceof Objects) {
		const inventory = await entity.Player.Inventory;
		const backupObject = await inventory.getBackupObject();
		const activeObject = await inventory.getActiveObject();
		if (backupObject.id === item.id || activeObject.id === item.id) {
			autoSell = true;
		}
		if (backupObject.rarity === 0) {
			autoReplace = true;
		}
		embed.setDescription(format(JsonReader.commands.inventory.getTranslation(language).randomItemDesc, {
			actualItem: backupObject.toString(language)
		}));
	}
	if (item instanceof Weapons) {
		const weapon = await entity.Player.Inventory.getWeapon();
		if (weapon.id === item.id) {
			autoSell = true;
		}
		if (weapon.rarity === 0) {
			autoReplace = true;
		}
		embed.setDescription(format(JsonReader.commands.inventory.getTranslation(language).randomItemDesc, {
			actualItem: weapon.toString(language)
		}));
	}
	if (item instanceof Armors) {
		const armor = await entity.Player.Inventory.getArmor();
		if (armor.id === item.id) {
			autoSell = true;
		}
		if (armor.rarity === 0) {
			autoReplace = true;
		}
		embed.setDescription(format(JsonReader.commands.inventory.getTranslation(language).randomItemDesc, {
			actualItem: armor.toString(language)
		}));
	}

	if (autoSell && item instanceof Potions) {
		return await destroyPotionMessage(channel, language, discordUser, item, true);
	}
	else if (autoSell) {
		const money = Math.round(getItemValue(item) * resaleMultiplierNew);
		entity.Player.addMoney(money);
		await entity.Player.save();
		return await channel.send(
			new DraftBotEmbed()
				.formatAuthor(JsonReader.commands.sell.getTranslation(language).soldMessageAlreadyOwnTitle, discordUser)
				.setDescription(
					format(JsonReader.commands.sell.getTranslation(language).soldMessage,
						{
							item: item.getName(language),
							money: money
						}
					)
				)
		);
	}
	await channel.send(receivedEmbed);
	if (autoReplace) {
		return await saveItem(item, entity);
	}

	const msg = await channel.send(embed);
	const filterConfirm = (reaction, user) => (reaction.emoji.name === MENU_REACTION.ACCEPT || reaction.emoji.name === MENU_REACTION.DENY) && user.id === discordUser.id;

	const collector = msg.createReactionCollector(filterConfirm, {
		time: COLLECTOR_TIME,
		max: 1
	});
	addBlockedPlayer(discordUser.id, "acceptItem", collector);

	collector.on("end", async (reaction) => {
		const [newEntity] = await Entities.getOrRegister(entity.discordUserId);
		removeBlockedPlayer(discordUser.id);
		if (reaction.first()) { // a reaction exist
			// msg.delete(); for now we are going to keep the message
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				const menuEmbed = new DraftBotEmbed();
				menuEmbed.formatAuthor(JsonReader.commands.inventory.getTranslation(language).acceptedTitle, discordUser)
					.setDescription(item.toString(language));

				const oldItem = await saveItem(item, entity);
				await channel.send(menuEmbed);
				item = oldItem;
				resaleMultiplier = resaleMultiplierActual;
			}
			if (item instanceof Potions) {
				return await destroyPotionMessage(channel, language, discordUser, item);
			}
		}
		else if (item instanceof Potions) {
			return await destroyPotionMessage(channel, language, discordUser, item);
		}
		const money = Math.round(getItemValue(item) * resaleMultiplier);
		newEntity.Player.addMoney(money);
		await newEntity.Player.save();
		return await channel.send(
			new DraftBotEmbed()
				.formatAuthor(JsonReader.commands.sell.getTranslation(language).soldMessageTitle, discordUser)
				.setDescription(
					format(JsonReader.commands.sell.getTranslation(language).soldMessage,
						{
							item: item.getName(language),
							money: money
						}
					)
				)
		);
	});
	await Promise.all([
		msg.react(MENU_REACTION.ACCEPT),
		msg.react(MENU_REACTION.DENY)
	]);

};

/**
 * Sends a destroyed potion message
 * @param channel
 * @param language
 * @param discordUser
 * @param item
 * @param isAutoSell
 * @return {Promise<*>}
 */
global.destroyPotionMessage = async (channel, language, discordUser, item, isAutoSell = false) => {
	const titleEmbedDestroyPotionMessage = isAutoSell
		? JsonReader.commands.sell.getTranslation(language).soldMessageAlreadyOwnTitle
		: JsonReader.commands.sell.getTranslation(language).potionDestroyedTitle;
	return await channel.send(
		new DraftBotEmbed()
			.formatAuthor(titleEmbedDestroyPotionMessage, discordUser)
			.setDescription(
				format(JsonReader.commands.sell.getTranslation(language).potionDestroyedMessage,
					{
						item: item.getName(language)
					}
				)
			)
	); // potion are not sold (because of exploits and because of logic)
};

/**
 * give a random item
 * @param {module:"discord.js".User} discordUser
 * @param {module:"discord.js".TextChannel} channel
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Entity} entity
 */
global.giveRandomItem = async (discordUser, channel, language, entity) => {
	const item = await entity.Player.Inventory.generateRandomItem();
	return await giveItem(entity, item, language, discordUser, channel);
};

/**
 * Generate a random rarity. Legendary is very rare and common is not rare at all
 * @param {number} maxRarity
 * @return {Number} generated rarity
 */
global.generateRandomRarity = (maxRarity = RARITY.MYTHICAL) => {
	const randomValue = randInt(0, JsonReader.values.raritiesGenerator.maxValue -
		(maxRarity === RARITY.MYTHICAL ? 0 : JsonReader.values.raritiesGenerator.maxValue - JsonReader.values.raritiesGenerator[maxRarity - 1]));

	if (randomValue <= JsonReader.values.raritiesGenerator["0"]) {
		return RARITY.COMMON;
	}
	else if (randomValue <= JsonReader.values.raritiesGenerator["1"]) {
		return RARITY.UNCOMMON;
	}
	else if (randomValue <= JsonReader.values.raritiesGenerator["2"]) {
		return RARITY.EXOTIC;
	}
	else if (randomValue <= JsonReader.values.raritiesGenerator["3"]) {
		return RARITY.RARE;
	}
	else if (randomValue <= JsonReader.values.raritiesGenerator["4"]) {
		return RARITY.SPECIAL;
	}
	else if (randomValue <= JsonReader.values.raritiesGenerator["5"]) {
		return RARITY.EPIC;
	}
	else if (randomValue <= JsonReader.values.raritiesGenerator["6"]) {
		return RARITY.LEGENDARY;
	}
	return RARITY.MYTHICAL;
};


/**
 * Generate a random itemType
 * @return {Number}
 */
global.generateRandomItemType = () => JsonReader.values.itemGenerator.tab[draftbotRandom.integer(1, JsonReader.values.itemGenerator.max - 1)];

/**
 * Convert a number of milliseconds in a number of minutes
 * @param {Number} milliseconds - The number of milliseconds
 * @return {Number}
 */
global.millisecondsToMinutes = (milliseconds) => Math.round(milliseconds / 60000);

/**
 * Convert a number of milliseconds in a number of hours
 * @param {Number} milliseconds - The number of milliseconds
 * @return {Number}
 */
global.millisecondsToHours = (milliseconds) => milliseconds / 3600000;

/**
 * Convert a number of minutes in a number of milliseconds
 * @param {Number} minutes - The number of minutes
 * @return {Number}
 */
global.minutesToMilliseconds = (minutes) => minutes * 60000;

/**
 * Return a string containing a proper display of a duration
 * @param {Number} minutes - The number of minutes to display
 * @return {String}
 */
global.minutesToString = (minutes) => {
	const hours = Math.floor(minutes / 60);
	minutes %= 60;

	let display;
	if (hours > 0) {
		display = hours + " H " + minutes + " Min";
	}
	else if (minutes !== 0) {
		display = minutes + " Min";
	}
	else {
		display = "< 1 Min";
	}

	return display;
};

/**
 * @param {String} string
 * @param {Object} replacement
 * @return {String}
 */
global.format = (string, replacement) => {
	if (!replacement || !replacement.hasOwnProperty) {
		replacement = {};
	}

	return string.replace(/{([0-9a-zA-Z_]+)}/g, (match, i, index) => {

		if (string[index - 1] === "{" &&
			string[index + match.length] === "}") {
			return i;
		}
		const result = Object.prototype.hasOwnProperty.call(replacement, i) ? replacement[i] : null;
		if (result === null || result === undefined) {
			return "";
		}

		return result;

	});
};

/**
 * Generates a random int between min (included) and max (excluded)
 * @param {Number} min
 * @param {Number} max
 * @return {number}
 */
global.randInt = (min, max) => draftbotRandom.integer(min, max - 1);

/**
 * Create a text progress bar
 * @param {Number} value
 * @param {Number} maxValue
 * @return {String} - The bar
 */
global.progressBar = (value, maxValue) => {
	let percentage = value / maxValue; // Calculate the percentage of the bar
	if (percentage < 0 || isNaN(percentage) || percentage === Infinity) {
		percentage = 0;
	}
	if (percentage > 1) {
		percentage = 1;
	}
	const progress = Math.round(PROGRESSBARS_SIZE * percentage); // Calculate the number of square caracters to fill the progress side.
	const emptyProgress = PROGRESSBARS_SIZE - progress; // Calculate the number of dash caracters to fill the empty progress side.

	const progressText = "▇".repeat(progress); // Repeat is creating a string with progress * caracters in it
	const emptyProgressText = "—".repeat(emptyProgress); // Repeat is creating a string with empty progress * caracters in it
	const percentageText = Math.floor(percentage * 100) + "%"; // Displaying the percentage of the bar

	return "```[" + progressText + emptyProgressText + "]" + percentageText + "```"; // Creating the bar
};

/**
 * Return the value of the item
 * @param {Objects|Armors|Weapons|Potions} item
 * @return {Number} - The value of the item
 */
global.getItemValue = function(item) {
	let addedvalue;
	if (item instanceof Potions || item instanceof Objects) {
		addedvalue = parseInt(item.power);
	}
	if (item instanceof Weapons) {
		addedvalue = parseInt(item.rawAttack);
	}
	if (item instanceof Armors) {
		addedvalue = parseInt(item.rawDefense);
	}
	return parseInt(JsonReader.values.raritiesValues[item.rarity]) + addedvalue;
};

/**
 * Send an error if the user is blocked by a command
 * @param {module:"discord.js".User} user
 * @param {module:"discord.js".TextChannel} channel
 * @param {"fr"|"en"} language
 * @returns {boolean}
 */
global.sendBlockedError = async function(user, channel, language) {
	if (hasBlockedPlayer(user.id)) {
		await sendErrorMessage(user, channel, language, format(JsonReader.error.getTranslation(language).playerBlocked, {
			context: JsonReader.error.getTranslation(language).blockedContext[getBlockedPlayer(user.id).context]
		}));
		return true;
	}
	return false;
};

/**
 * Returns the next sunday 23h59 59s
 * @return {Date}
 */
global.getNextSundayMidnight = function() {
	const now = new Date();
	let dateOfReset = new Date();
	dateOfReset.setDate(now.getDate() + (7 - now.getDay()) % 7);
	dateOfReset.setHours(23, 59, 59);
	while (dateOfReset < now) {
		dateOfReset += 1000 * 60 * 60 * 24 * 7;
	}
	return new Date(dateOfReset);
};

/**
 * Returns the next day 01h59 59s
 * @return {Date}
 */
global.getNextDay2AM = function() {
	const now = new Date();
	const dateOfReset = new Date();
	dateOfReset.setHours(1, 59, 59);
	if (dateOfReset < now) {
		dateOfReset.setDate(dateOfReset.getDate() + 1);
	}
	return new Date(dateOfReset);
};

global.parseTimeDifference = function(date1, date2, language) {
	if (date1 > date2) {
		date1 = [date2, date2 = date1][0];
	}
	let seconds = Math.floor((date2 - date1) / 1000);
	let parsed = "";
	const days = Math.floor(seconds / (24 * 60 * 60));
	if (days > 0) {
		parsed += days + (language === "fr" ? " J " : " D ");
		seconds -= days * 24 * 60 * 60;
	}
	const hours = Math.floor(seconds / (60 * 60));
	parsed += hours + " H ";
	seconds -= hours * 60 * 60;
	const minutes = Math.floor(seconds / 60);
	parsed += minutes + " Min ";
	seconds -= minutes * 60;
	parsed += seconds + " s";
	return parsed;
};

/**
 * Block commands if it is 5 minutes before top week reset
 * @return {boolean}
 */
global.resetIsNow = function() {
	return getNextSundayMidnight() - new Date() <= 1000 * 5 * 60;
};

/**
 * Allow to get the validation information of a guild
 * @param {module:"discord.js".Guild} guild - The guild that has to be checked
 */
global.getValidationInfos = function(guild) {
	const humans = guild.members.cache.filter(member => !member.user.bot).size;
	const bots = guild.members.cache.filter(member => member.user.bot).size;
	const ratio = Math.round(bots / humans * 100);
	let validation = ":white_check_mark:";
	if (ratio > 30 || humans < 30 || humans < 100 && ratio > 20) {
		validation = ":x:";
	}
	else if (ratio > 20 || bots > 15 || humans < 100) {
		validation = ":warning:";
	}
	return {validation: validation, humans: humans, bots: bots, ratio: ratio};
};

async function saveItem(item, entity) {
	let oldItem;
	if (item instanceof Potions) {
		oldItem = await Potions.findOne({where: {id: entity.Player.Inventory.potionId}});
		entity.Player.Inventory.potionId = item.id;
	}
	if (item instanceof Objects) {
		oldItem = await Objects.findOne({where: {id: entity.Player.Inventory.backupId}});
		entity.Player.Inventory.backupId = item.id;
	}
	if (item instanceof Weapons) {
		oldItem = await Weapons.findOne({where: {id: entity.Player.Inventory.weaponId}});
		entity.Player.Inventory.weaponId = item.id;
	}
	if (item instanceof Armors) {
		oldItem = await Armors.findOne({where: {id: entity.Player.Inventory.armorId}});
		entity.Player.Inventory.armorId = item.id;
	}
	await Promise.all([
		entity.save(),
		entity.Player.save(),
		entity.Player.Inventory.save()
	]);
	return oldItem;
}

global.checkNameString = (name, minLength, maxLength) => {
	const regexAllowed = RegExp(/^[A-Za-z0-9 ÇçÜüÉéÂâÄäÀàÊêËëÈèÏïÎîÔôÖöÛû]+$/);
	const regexSpecialCases = RegExp(/^[0-9 ]+$|( {2})+/);
	return regexAllowed.test(name) && !regexSpecialCases.test(name) && name.length >= minLength && name.length <= maxLength;
};

/**
 * Check if the given food with its quantity can be added to the given guild storage
 * @param {Object} selectedItem - The item to add in the storage
 * @param {number} quantity - How many of selectedItem is asked to add in the storage
 * @param guild - The guild to check
 * @return {boolean}
 */
global.isStorageFullFor = (selectedItem, quantity, guild) => guild[selectedItem.type] + quantity > JsonReader.commands.guildShop.max[selectedItem.type];

global.giveFood = async (message, language, entity, author, selectedItem, quantity) => {
	const guild = await Guilds.getById(entity.Player.guildId);
	if (isStorageFullFor(selectedItem, quantity, guild)) {
		return sendErrorMessage(
			author,
			message.channel,
			language,
			JsonReader.commands.guildShop.getTranslation(language).fullStock
		);
	}
	guild[selectedItem.type] += quantity;
	await Promise.all([guild.save()]);
	const successEmbed = new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.guildShop.getTranslation(language).success, author);
	if (quantity === 1) {
		successEmbed.setDescription(
			format(
				JsonReader.commands.guildShop.getTranslation(language)
					.singleSuccessAddFoodDesc,
				{
					emote: selectedItem.emote,
					quantity: quantity,
					name: selectedItem.translations[language].name
						.slice(2, -2)
						.toLowerCase()
				}
			)
		);
	}
	else {
		successEmbed.setDescription(
			format(
				JsonReader.commands.guildShop.getTranslation(language)
					.multipleSuccessAddFoodDesc,
				{
					emote: selectedItem.emote,
					quantity: quantity,
					name:
						selectedItem.type === "ultimateFood" && language === "fr" ? selectedItem.translations[language].name
							.slice(2, -2)
							.toLowerCase()
							.replace(
								selectedItem.translations[language].name
									.slice(2, -2)
									.toLowerCase()
									.split(" ")[0],
								selectedItem.translations[language].name
									.slice(2, -2)
									.toLowerCase()
									.split(" ")[0]
									.concat("s")
							)
							: selectedItem.translations[language].name
								.slice(2, -2)
								.toLowerCase()
				}
			)
		);
	}
	return message.channel.send(successEmbed);
};
