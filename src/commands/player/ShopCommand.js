const Maps = require("../../core/Maps");
/**
 * Displays the shop
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function ShopCommand(language, message) {
	const [entity] = await Entities.getOrRegister(message.author.id); // Loading player

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity) !== true) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const shopTranslations = JsonReader.commands.shop.getTranslation(language);

	const shopPotion = await Shop.findOne({
		attributes: ["shopPotionId"]
	});

	// Formatting intems data into a string
	const randomItem = format(shopTranslations.display, {
		name: shopTranslations.permanentItems.randomItem.name,
		price: shopTranslations.permanentItems.randomItem.price
	});
	const healAlterations = format(shopTranslations.display, {
		name: shopTranslations.permanentItems.healAlterations.name,
		price: shopTranslations.permanentItems.healAlterations.price
	});
	const regen = format(shopTranslations.display, {
		name: shopTranslations.permanentItems.regen.name,
		price: shopTranslations.permanentItems.regen.price
	});
	const badge = format(shopTranslations.display, {
		name: shopTranslations.permanentItems.badge.name,
		price: shopTranslations.permanentItems.badge.price
	});

	// Fetching potion infos
	const potion = await Potions.findOne({
		where: {
			id: shopPotion.shopPotionId
		}
	});

	const potionPrice = Math.round(
		getItemValue(potion) * 0.7
	);

	// Creating shop message
	const shopMessage = await message.channel.send(
		new discord.MessageEmbed()
			.setColor(JsonReader.bot.embed.default)
			.setTitle(shopTranslations.title)
			.addField(
				shopTranslations.dailyItem,
				format(shopTranslations.display, {
					name: potion.toString(language),
					price: potionPrice
				})
			)
			.addField(
				shopTranslations.permanentItem,
				[randomItem, healAlterations, regen, badge].join("\n") +
				format(shopTranslations.moneyQuantity, {
					money: entity.Player.money
				})
			)
	);

	// Creating maps to get shop items everywhere
	const dailyPotion = new Map()
		.set("price", potionPrice)
		.set("potion", potion);
	const shopItems = new Map()
		.set(SHOP.QUESTION, shopTranslations.permanentItems.randomItem)
		.set(SHOP.HOSPITAL, shopTranslations.permanentItems.healAlterations)
		.set(SHOP.HEART, shopTranslations.permanentItems.regen)
		.set(SHOP.MONEY_MOUTH, shopTranslations.permanentItems.badge);

	const filterConfirm = (reaction, user) => user.id === entity.discordUserId && reaction.me;

	const collector = shopMessage.createReactionCollector(filterConfirm, {
		time: COLLECTOR_TIME,
		max: 1
	});

	addBlockedPlayer(entity.discordUserId, "shop", collector);

	// Fetch the choice from the user
	collector.on("end", async(reaction) => {
		if (!reaction.first()) {
			// the user is afk
			removeBlockedPlayer(entity.discordUserId);
			return;
		}
		if (reaction.first().emoji.name === MENU_REACTION.DENY) {
			removeBlockedPlayer(entity.discordUserId);
			sendErrorMessage(
				message.author,
				message.channel,
				language,
				JsonReader.commands.shop.getTranslation(language).error
					.leaveShop, true
			);
			return;
		}

		const potion = dailyPotion.get("potion");
		const potionPrice = dailyPotion.get("price");
		if (shopItems.has(reaction.first().emoji.name)) {
			const item = shopItems.get(reaction.first().emoji.name);
			if (canBuy(item.price, entity.Player)) {
				await confirmPurchase(
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
				sendErrorMessage(
					message.author,
					message.channel,
					language,
					format(
						JsonReader.commands.shop.getTranslation(language).error
							.cannotBuy,
						{
							missingMoney: item.price - entity.Player.money
						}
					)
				);
				removeBlockedPlayer(entity.discordUserId);
			}
		}
		else if (
			potion.getEmoji() === reaction.first().emoji.id ||
			potion.getEmoji() === reaction.first().emoji.name ||
			SHOP.POTION_REPLACEMENT === reaction.first().emoji.name ||
			SHOP.POTION_REPLACEMENT === reaction.first().id
		) {
			if (canBuy(potionPrice, entity.Player)) {
				await confirmPurchase(
					shopMessage,
					language,
					potion.toString(language),
					potionPrice,
					JsonReader.commands.shop.getTranslation(language).potion
						.info,
					entity,
					message.author,
					dailyPotion
				);
			}
			else {
				sendErrorMessage(
					message.author,
					message.channel,
					language,
					format(
						JsonReader.commands.shop.getTranslation(language).error
							.cannotBuy,
						{
							missingMoney: potionPrice - entity.Player.money
						}
					)
				);
				removeBlockedPlayer(entity.discordUserId);
			}
		}
	});

	// Adding reactions
	try {
		await shopMessage.react(potion.getEmoji());
	}
	catch {
		await shopMessage.react(SHOP.POTION_REPLACEMENT);
	}
	await Promise.all([
		shopMessage.react(SHOP.QUESTION),
		shopMessage.react(SHOP.HOSPITAL),
		shopMessage.react(SHOP.HEART),
		shopMessage.react(SHOP.MONEY_MOUTH),
		shopMessage.react(MENU_REACTION.DENY)
	]);
}

/**
 * @param {module:"discord.js".Message} message - The message where the react event trigerred
 * @param {Collection<Snowflake, MessageReaction>} reaction - The reaction
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {Entities} customer
 * @param {any} selectedItem
 */
async function sellItem(message, reaction, language, entity, customer, selectedItem) {
	[entity] = await Entities.getOrRegister(entity.discordUserId);
	const shopTranslations = JsonReader.commands.shop.getTranslation(language);
	log(entity.discordUserId + " bought the shop item " + selectedItem.name + " for " + selectedItem.price);
	if (selectedItem.name) {
		// This is not a potion
		if (
			selectedItem.name ===
			shopTranslations.permanentItems.randomItem.name
		) {
			await giveRandomItem(customer, message.channel, language, entity);
		}
		else if (
			selectedItem.name ===
			shopTranslations.permanentItems.healAlterations.name
		) {
			if (entity.Player.currentEffectFinished()) {
				return sendErrorMessage(
					customer,
					message.channel,
					language,
					JsonReader.commands.shop.getTranslation(language).error
						.nothingToHeal
				);
			}
			await healAlterations(message, language, entity, customer, selectedItem);
		}
		else if (
			selectedItem.name === shopTranslations.permanentItems.regen.name
		) {
			await regenPlayer(
				message,
				language,
				entity,
				customer,
				selectedItem
			);
		}
		else if (
			selectedItem.name === shopTranslations.permanentItems.badge.name
		) {
			const success = giveMoneyMouthBadge(
				message,
				language,
				entity,
				customer,
				selectedItem
			);
			if (!success) {
				return;
			}
		}
		else if (
			selectedItem.name === shopTranslations.permanentItems.guildXp.name
		) {
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
	}
	else {
		giveDailyPotion(message, language, entity, customer, selectedItem);
	}

	await Promise.all([
		entity.save(),
		entity.Player.save(),
		entity.Player.Inventory.save()
	]);
}

/**
 * @param {module:"discord.js".Message} message - The message where the react event trigerred
 * @param {"fr"|"en"} language
 * @param {string} name
 * @param {number} price
 * @param {string} info
 * @param {Entities} entity
 * @param {Entities} customer
 * @param {any} selectedItem
 */
async function confirmPurchase(
	message,
	language,
	name,
	price,
	info,
	entity,
	customer,
	selectedItem
) {
	addBlockedPlayer(entity.discordUserId, "confirmBuy");
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

	collector.on("end", (reaction) => {
		removeBlockedPlayer(entity.discordUserId);
		if (reaction.first()) {
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				reaction.first().message.delete();
				return sellItem(message, reaction, language, entity, customer, selectedItem);
			}
		}
		sendErrorMessage(customer, message.channel, language, JsonReader.commands.shop.getTranslation(language).error.canceledPurchase, true);
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

/** ******************************************************** GIVE FUNCTIONS **********************************************************/

/**
 * Give the daily potion to player
 */
function giveDailyPotion(message, language, entity, customer, dailyPotion) {
	log(
		entity.discordUserId +
		" bought the daily shop potion " +
		dailyPotion.get("potion")[language] +
		" for " +
		dailyPotion.get("price")
	);
	entity.Player.Inventory.giveObject(
		dailyPotion.get("potion").id,
		ITEMTYPE.POTION
	); // Give potion
	entity.Player.addMoney(-dailyPotion.get("price")); // Remove money
	entity.Player.Inventory.save(); // Save
	entity.Player.save(); // Save
	message.channel.send(
		new discord.MessageEmbed()
			.setColor(JsonReader.bot.embed.default)
			.setAuthor(
				format(
					JsonReader.commands.shop.getTranslation(language).potion
						.give,
					{
						pseudo: customer.username
					}
				),
				customer.displayAvatarURL()
			)
			.setDescription(
				"\n\n" + dailyPotion.get("potion").toString(language)
			)
	);
}

/**
 * Clear all player alterations
 */
async function healAlterations(message, language, entity, customer, selectedItem) {
	if (entity.Player.effect !== EFFECT.DEAD && entity.Player.effect !== EFFECT.LOCKED) {
		await Maps.removeEffect(entity.Player);
	}
	await message.channel.send(
		new discord.MessageEmbed()
			.setColor(JsonReader.bot.embed.default)
			.setAuthor(
				format(
					JsonReader.commands.shop.getTranslation(language).success,
					{
						pseudo: customer.username
					}
				),
				customer.displayAvatarURL()
			)
			.setDescription("\n\n" + selectedItem.give)
	);
}

/**
 * Completely restore player life
 */
async function regenPlayer(message, language, entity, customer, selectedItem) {
	await entity.setHealth(await entity.getMaxHealth()); // Heal Player
	await message.channel.send(
		new discord.MessageEmbed()
			.setColor(JsonReader.bot.embed.default)
			.setAuthor(
				format(
					JsonReader.commands.shop.getTranslation(language).success,
					{
						pseudo: customer.username
					}
				),
				customer.displayAvatarURL()
			)
			.setDescription("\n\n" + selectedItem.give)
	);
}

/**
 * Give "MoneyMouth" badge to the player
 */
function giveMoneyMouthBadge(
	message,
	language,
	entity,
	customer,
	selectedItem
) {
	if (entity.Player.hasBadge("🤑")) {
		sendErrorMessage(
			customer,
			message.channel,
			language,
			JsonReader.commands.shop.getTranslation(language).error
				.alreadyHasItem
		);
		return false;
	}
	entity.Player.addBadge("🤑"); // Give badge
	message.channel.send(
		new discord.MessageEmbed()
			.setColor(JsonReader.bot.embed.default)
			.setAuthor(
				format(selectedItem.give, {
					pseudo: customer.username
				}),
				customer.displayAvatarURL()
			)
			.setDescription("\n\n" + selectedItem.name)
	);
	return true;

}

module.exports = {
	commands: [
		{
			name: "shop",
			func: ShopCommand,
			aliases: ["s"]
		}
	]
};
