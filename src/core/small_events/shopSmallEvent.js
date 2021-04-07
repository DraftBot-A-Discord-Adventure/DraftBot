/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {

	let randomItem = await entity.Player.Inventory.generateRandomItem(RARITY.SPECIAL);
	let price = getItemValue(randomItem);
	if (randInt(1, 10) === 10) {
		price *= 5;
	} else {
		price *= 0.6;
	}
	price = Math.round(price);
	let gender = randInt(0, 1);
	seEmbed.setDescription(seEmbed.description + format(JsonReader.small_events.shop.getTranslation(language).intro[gender][randInt(0, JsonReader.small_events.shop.getTranslation(language).intro[gender].length)] + JsonReader.small_events.shop.getTranslation(language).end, {
		name: JsonReader.small_events.shop.getTranslation(language).names[gender][randInt(0, JsonReader.small_events.shop.getTranslation(language).names[gender].length)],
		item: randomItem.toString(language),
		price: price
	}));
	const msg = await message.channel.send(seEmbed);
	await Promise.all([
		msg.react(MENU_REACTION.ACCEPT),
		msg.react(MENU_REACTION.DENY)
	]);
	const filterConfirm = (reaction, user) => {
		return (
			(reaction.emoji.name === MENU_REACTION.ACCEPT ||
				reaction.emoji.name === MENU_REACTION.DENY) &&
			user.id === entity.discordUser_id
		);
	};

	const collector = msg.createReactionCollector(filterConfirm, {
		time: COLLECTOR_TIME,
		max: 1,
	});

	collector.on("end", async (reaction) => {
		removeBlockedPlayer(entity.discordUser_id);
		if (reaction.first()) {
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {

				if (entity.Player.money < price) {
					return await sendErrorMessage(
						message.author,
						message.channel,
						language,
						format(
							JsonReader.commands.shop.getTranslation(language).error.cannotBuy,
							{
								missingMoney: price - entity.Player.money,
							}
						)
					);
				}

				await giveItem(entity, randomItem, language, message.author, message.channel, 0.1);
				log(entity.discordUser_id + " bought an item in a mini shop for " + price);
				entity.Player.addMoney(-price);
				await Promise.all([
					entity.Player.save(),
					entity.Player.Inventory.save(),
				]);
				return;
			}
		}
		await sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.shop.getTranslation(language).error
				.canceledPurchase
		);
	});
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};