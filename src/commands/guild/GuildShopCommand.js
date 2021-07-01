/**
 * Displays the guild shop
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {Translations} from "../../core/Translations";
import {ShopItem} from "../../core/messages/DraftBotShopMessage";

/*async function GuildShopCommand(language, message) {
	const [entity] = await Entities.getOrRegister(message.author.id); // Loading player

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity) !== true) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	// search for a user's guild
	let guild;
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}

	if (guild === null) {
		// not in a guild
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildDaily.getTranslation(language).notInAGuild);
	}

	const shopTranslations = Translations.getModule("commands.shop", language);
	const guildShopTranslations = Translations.getModule("commands.guildShop", language);
	const foodTranslations = Translations.getModule("food", language);


}*/

/**
 * Displays the guild shop
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function GuildShopCommand(language, message) {
	const [entity] = await Entities.getOrRegister(message.author.id); // Loading player

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity) !== true) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	// search for a user's guild
	let guild;
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}

	if (guild === null) {
		// not in a guild
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildDaily.getTranslation(language).notInAGuild);
	}

	const shopTranslations = JsonReader.commands.guildShop.getTranslation(
		language
	);

	// Formatting items data into a string

	const commonFood = format(shopTranslations.display, {
		emote: JsonReader.food.commonFood.emote,
		name: JsonReader.food.commonFood.translations[language].name,
		price: JsonReader.food.commonFood.price
	});

	const herbivorousFood = format(shopTranslations.display, {
		emote: JsonReader.food.herbivorousFood.emote,
		name: JsonReader.food.herbivorousFood.translations[language].name,
		price: JsonReader.food.herbivorousFood.price
	});
	const carnivorousFood = format(shopTranslations.display, {
		emote: JsonReader.food.carnivorousFood.emote,
		name: JsonReader.food.carnivorousFood.translations[language].name,
		price: JsonReader.food.carnivorousFood.price
	});

	const ultimateFood = format(shopTranslations.display, {
		emote: JsonReader.food.ultimateFood.emote,
		name: JsonReader.food.ultimateFood.translations[language].name,
		price: JsonReader.food.ultimateFood.price
	});

	const guildXp = format(shopTranslations.display, {
		name: shopTranslations.guildXp.name,
		price: shopTranslations.guildXp.price
	});

	// Creating shop message
	const shopMessage = await message.channel.send(
		new discord.MessageEmbed()
			.setColor(JsonReader.bot.embed.default)
			.setTitle(shopTranslations.title)
			.addField(shopTranslations.xpItem, [guildXp])
			.addField(
				shopTranslations.foodItem,
				[
					commonFood,
					herbivorousFood,
					carnivorousFood,
					ultimateFood
				].join("\n") +
				format(shopTranslations.moneyQuantity, {
					money: entity.Player.money
				})
			)
	);

	// Creating maps to get shop items everywhere

	const shopItems = new Map()
		.set(GUILDSHOP.STAR, shopTranslations.guildXp)
		.set(GUILDSHOP.COMMON_FOOD, JsonReader.food.commonFood)
		.set(GUILDSHOP.HERBIVOROUS_FOOD, JsonReader.food.herbivorousFood)
		.set(GUILDSHOP.CARNIVOROUS_FOOD, JsonReader.food.carnivorousFood)
		.set(GUILDSHOP.ULTIMATE_FOOD, JsonReader.food.ultimateFood);

	const filterConfirm = (reaction, user) => user.id === entity.discordUserId && reaction.me;

	const collector = shopMessage.createReactionCollector(filterConfirm, {
		time: COLLECTOR_TIME,
		max: 1
	});

	addBlockedPlayer(entity.discordUserId, "guildShop", collector);

	// Fetch the choice from the user
	collector.on("end", async(reaction) => {
		removeBlockedPlayer(entity.discordUserId);
		if (
			!reaction.first() ||
			reaction.first().emoji.name === MENU_REACTION.DENY
		) {
			return sendErrorMessage(
				message.author,
				message.channel,
				language,
				JsonReader.commands.shop.getTranslation(language).error
					.leaveShop, true
			);
		}

		if (shopItems.has(reaction.first().emoji.name)) {
			const item = shopItems.get(reaction.first().emoji.name);
			if (item.type === "guildXp") {
				if (!canBuy(item.price, entity.Player)) {
					return sendErrorMessage(
						message.author,
						message.channel,
						language,
						format(
							JsonReader.commands.shop.getTranslation(language)
								.error.cannotBuy,
							{
								missingMoney: item.price - entity.Player.money
							}
						)
					);
				}
				await confirmXpPurchase(
					shopMessage,
					language,
					item.name,
					item.price,
					item.info,
					entity,
					message.author,
					item
				);
			}
			else {
				purchaseFood(
					shopMessage,
					language,
					entity,
					message.author,
					item
				);
			}
		}
	});

	// Adding reactions

	await Promise.all([
		shopMessage.react(GUILDSHOP.STAR),
		shopMessage.react(GUILDSHOP.COMMON_FOOD),
		shopMessage.react(GUILDSHOP.HERBIVOROUS_FOOD),
		shopMessage.react(GUILDSHOP.CARNIVOROUS_FOOD),
		shopMessage.react(GUILDSHOP.ULTIMATE_FOOD),
		shopMessage.react(MENU_REACTION.DENY)
	]);
}

/**
 * food purchase
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity - author of message (for bot)
 * @param author - author of message
 * @param selectedItem - selectionned item
 */

async function purchaseFood(message, language, entity, author, selectedItem) {
	const quantityPosibilities = new Map()
		.set(QUANTITY.ONE, 1)
		.set(QUANTITY.FIVE, 5);
	if (selectedItem.type !== "ultimateFood") {
		quantityPosibilities.set(QUANTITY.TEN, 10);
	}

	const confirmEmbed = new discord.MessageEmbed()
		.setColor(JsonReader.bot.embed.default)
		.setAuthor(
			format(JsonReader.commands.shop.getTranslation(language).confirm, {
				pseudo: author.username
			}),
			author.displayAvatarURL()
		);
	if (selectedItem.type === "ultimateFood") {
		confirmEmbed.setDescription(
			"\n\u200b\n" +
			format(
				JsonReader.commands.guildShop.getTranslation(language)
					.confirmEmbedFieldForUltimateFood,
				{
					emote: selectedItem.emote,
					name: selectedItem.translations[language].name,
					price1: selectedItem.price,
					price5: selectedItem.price * 5
				}
			) +
			format(
				JsonReader.commands.guildShop.getTranslation(language)
					.description,
				{
					info: selectedItem.translations[language].info
				}
			) +
			JsonReader.commands.guildShop.getTranslation(language)
				.selectQuantityWarning
		);
	}
	else {
		confirmEmbed.setDescription(
			"\n\u200b\n" +
			format(
				JsonReader.commands.guildShop.getTranslation(language)
					.confirmEmbedField,
				{
					emote: selectedItem.emote,
					name: selectedItem.translations[language].name,
					price1: selectedItem.price,
					price5: selectedItem.price * 5,
					price10: selectedItem.price * 10
				}
			) +
			format(
				JsonReader.commands.guildShop.getTranslation(language)
					.description,
				{
					info: selectedItem.translations[language].info
				}
			) +
			JsonReader.commands.guildShop.getTranslation(language)
				.selectQuantityWarning
		);
	}

	const confirmMessage = await message.channel.send(confirmEmbed);

	const filterConfirm = (reaction, user) => user.id === entity.discordUserId && reaction.me;

	const collector = confirmMessage.createReactionCollector(filterConfirm, {
		time: COLLECTOR_TIME,
		max: 1
	});

	addBlockedPlayer(entity.discordUserId, "selectQuantity");

	collector.on("end", async(reaction) => {
		removeBlockedPlayer(entity.discordUserId);
		if (
			!reaction.first() ||
			reaction.first().emoji.name === MENU_REACTION.DENY
		) {
			return sendErrorMessage(
				author,
				message.channel,
				language,
				JsonReader.commands.shop.getTranslation(language).error
					.canceledPurchase, true
			);
		}

		const quantity = quantityPosibilities.get(reaction.first().emoji.name);
		if (selectedItem.price * quantity > entity.Player.money) {
			return sendErrorMessage(
				message.author,
				message.channel,
				language,
				format(
					JsonReader.commands.shop.getTranslation(language).error
						.cannotBuy,
					{
						missingMoney:
							selectedItem.price * quantity - entity.Player.money
					}
				)
			);
		}
		await giveFood(
			message,
			language,
			entity,
			author,
			selectedItem,
			quantity
		);
	});
	if (selectedItem.type === "ultimateFood") {
		await Promise.all([
			confirmMessage.react(QUANTITY.ONE),
			confirmMessage.react(QUANTITY.FIVE),
			confirmMessage.react(MENU_REACTION.DENY)
		]);
	}
	else {
		await Promise.all([
			confirmMessage.react(QUANTITY.ONE),
			confirmMessage.react(QUANTITY.FIVE),
			confirmMessage.react(QUANTITY.TEN),
			confirmMessage.react(MENU_REACTION.DENY)
		]);
	}
}

/**
 * @param {module:"discord.js".Message} message - The message where the react event trigerred
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {Entities} customer
 * @param {any} selectedItem
 */
async function purchaseXp(message, language, entity, customer, selectedItem) {
	[entity] = await Entities.getOrRegister(entity.discordUserId);
	const shopTranslations = JsonReader.commands.shop.getTranslation(language);
	log(
		entity.discordUserId +
		" bought guild xp " +
		selectedItem.name +
		" for " +
		selectedItem.price
	);

	if (selectedItem.name === shopTranslations.permanentItems.guildXp.name) {
		if (
			!await giveGuildXp(
				message,
				language,
				entity,
				customer,
				selectedItem
			)
		) {
			return;
		} // if no guild, no need to proceed
	}
	entity.Player.addMoney(-selectedItem.price); // Remove money

	await Promise.all([
		entity.save(),
		entity.Player.save(),
		entity.Player.Inventory.save()
	]);
}

/**
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {String|string} name - The item name
 * @param {number} price - The item price
 * @param {String|string} info - The info to display while trying to buy the item
 * @param {Entities} entity
 * @param {Entities} customer
 * @param {any} selectedItem
 *
 */
/* eslint-disable max-params */
async function confirmXpPurchase(
	message,
	language,
	name,
	price,
	info,
	entity,
	customer,
	selectedItem
) {
	/* eslint-enable max-params */
	const confirmEmbed = new discord.MessageEmbed()
		.setColor(JsonReader.bot.embed.default)
		.setAuthor(
			format(JsonReader.commands.shop.getTranslation(language).confirm, {
				pseudo: customer.username
			}),
			customer.displayAvatarURL()
		)
		.setDescription(
			"\n\u200b\n" +
			format(
				JsonReader.commands.shop.getTranslation(language).display,
				{
					name: name,
					price: price
				}
			) +
			info
		);

	const confirmMessage = await message.channel.send(confirmEmbed);

	const filterConfirm = (reaction, user) =>
		(reaction.emoji.name === MENU_REACTION.ACCEPT ||
				reaction.emoji.name === MENU_REACTION.DENY) &&
			user.id === entity.discordUserId
		;

	const collector = confirmMessage.createReactionCollector(filterConfirm, {
		time: COLLECTOR_TIME,
		max: 1
	});

	addBlockedPlayer(entity.discordUserId, "guildShop", collector);

	collector.on("end", (reaction) => {
		removeBlockedPlayer(entity.discordUserId);
		// confirmMessage.delete(); for now we'll keep the messages
		if (reaction.first()) {
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				reaction.first().message.delete();
				return purchaseXp(
					message,
					language,
					entity,
					customer,
					selectedItem
				);
			}
		}
		sendErrorMessage(
			customer,
			message.channel,
			language,
			JsonReader.commands.shop.getTranslation(language).error
				.canceledPurchase,
			true
		);
	});

	await Promise.all([
		confirmMessage.react(MENU_REACTION.ACCEPT),
		confirmMessage.react(MENU_REACTION.DENY)
	]);
}

/**
 * @param {number} price - The item price
 * @param {Players} player
 */

const canBuy = function(price, player) {
	return player.money >= price;
};

// Give guild xp

async function giveGuildXp(message, language, entity, author, selectedItem) {
	const guild = await Guilds.getById(entity.Player.guildId);
	const toAdd = randInt(50, 450);
	guild.addExperience(toAdd); // Add xp
	while (guild.needLevelUp()) {
		await guild.levelUpIfNeeded(message.channel, language);
	}
	await guild.save();

	return message.channel.send(
		new discord.MessageEmbed()
			.setColor(JsonReader.bot.embed.default)
			.setAuthor(
				format(
					JsonReader.commands.shop.getTranslation(language).success,
					{
						pseudo: author.username
					}
				),
				author.displayAvatarURL()
			)
			.setDescription(
				"\n\n" +
				format(selectedItem.give, {
					experience: toAdd
				})
			)
	);
}

const giveFood = async(
	message,
	language,
	entity,
	author,
	selectedItem,
	quantity
) => {
	const guild = await Guilds.getById(entity.Player.guildId);
	if (
		guild[selectedItem.type] + quantity >
		JsonReader.commands.guildShop.max[selectedItem.type]
	) {
		return sendErrorMessage(
			author,
			message.channel,
			language,
			JsonReader.commands.guildShop.getTranslation(language).fullStock
		);
	}
	guild[selectedItem.type] += quantity;
	await entity.Player.addMoney(-selectedItem.price * quantity); // Remove money
	await Promise.all([guild.save(), entity.Player.save()]);
	const successEmbed = new discord.MessageEmbed();
	successEmbed.setAuthor(
		format(JsonReader.commands.guildShop.getTranslation(language).success, {
			author: author.username
		}),
		author.displayAvatarURL()
	);
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

module.exports = {
	commands: [
		{
			name: "guildshop",
			func: GuildShopCommand,
			aliases: ["guildshop", "gs"]
		}
	],
	giveFood: giveFood
};
