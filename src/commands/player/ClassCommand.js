/**
 * Select a class
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function ClassCommand(language, message, args) {
	let [entity] = await Entities.getOrRegister(message.author.id); //Loading player

	if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity, CLASS.REQUIRED_LEVEL)) !== true) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const classTranslations = JsonReader.commands.class.getTranslation(language);

	let allClasses = await Classes.getByGroupId(entity.Player.getClassGroup());

	const embedClassMessage = new discord.MessageEmbed()
		.setColor(JsonReader.bot.embed.default)
		.setTitle(classTranslations.title)
		.setDescription(
			classTranslations.desc)

	for (let k = 0; k < allClasses.length; k++) {
		embedClassMessage.addField(allClasses[k].getName(language),
			format(
				classTranslations.classMainDisplay,
				{
					description: allClasses[k].getDescription(language),
					price: allClasses[k].price
				}
			), false
		)
	}

	embedClassMessage.addField(
		classTranslations.moneyQuantityTitle,
		format(classTranslations.moneyQuantity, {
			money: entity.Player.money,
		}));
	//Creating class message
	const classMessage = await message.channel.send(embedClassMessage);

	const filterConfirm = (reaction, user) => {
		return (user.id === entity.discordUser_id && reaction.me);
	};

	const collector = classMessage.createReactionCollector(filterConfirm, {time: 120000, max: 1});

	addBlockedPlayer(entity.discordUser_id, "class", collector);

	//Fetch the choice from the user
	collector.on("end", async (reaction) => {
		if (!reaction.first()) { //the user is afk
			removeBlockedPlayer(entity.discordUser_id);
			return;
		}
		if (reaction.first().emoji.name === MENU_REACTION.DENY) {
			removeBlockedPlayer(entity.discordUser_id);
			sendErrorMessage(message.author, message.channel, language, JsonReader.commands.class.getTranslation(language).error.leaveClass);
			return;
		}

		const selectedClass = await Classes.getByEmojy(reaction.first().emoji.name);
		confirmPurchase(message, language, selectedClass, entity);
	});

	//Adding reactions
	let classEmojis = new Map();
	for (let k = 0; k < allClasses.length; k++) {
		await classMessage.react(allClasses[k].emoji);
		classEmojis.set(allClasses[k].emoji, k);
	}
	classMessage.react(MENU_REACTION.DENY)
}

/**
 * @param {*} message - message where the command is from
 * @param {*} language - the language that has to be used
 * @param {*} selectedClass - The selected class
 * @param {*} entity - The entity that is playing
 */
async function confirmPurchase(message, language, selectedClass, entity) {

	const confirmEmbed = new discord.MessageEmbed()
		.setColor(JsonReader.bot.embed.default)
		.setAuthor(
			format(JsonReader.commands.class.getTranslation(language).confirm, {
				pseudo: message.author.username,
			}),
			message.author.displayAvatarURL()
		)
		.setDescription(
			"\n\u200b\n" +
			format(JsonReader.commands.class.getTranslation(language).display, {
				name: selectedClass.toString(language, entity.Player.level),
				price: selectedClass.price,
				description: selectedClass.getDescription(language)
			})
		);

	const confirmMessage = await message.channel.send(confirmEmbed);
	const filterConfirm = (reaction, user) => {
		return ((reaction.emoji.name === MENU_REACTION.ACCEPT || reaction.emoji.name === MENU_REACTION.DENY) && user.id === entity.discordUser_id);
	};

	const collector = confirmMessage.createReactionCollector(filterConfirm, {
		time: 120000,
		max: 1,
	});

	collector.on("end", async (reaction) => {
		const playerClass = await Classes.getById(entity.Player.class);
		removeBlockedPlayer(entity.discordUser_id);
		if (reaction.first()) {
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				if (!canBuy(selectedClass.price, entity.Player)) {
					return sendErrorMessage(message.author, message.channel, language, format(
						JsonReader.commands.class.getTranslation(language).error.cannotBuy,
						{
							missingMoney: selectedClass.price - entity.Player.money,
						}
					));
				}
				if (selectedClass.id === playerClass.id) {
					return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.class.getTranslation(language).error.sameClass);
				}
				reaction.first().message.delete();
				entity.Player.class = selectedClass.id;
				const newClass = await Classes.getById(entity.Player.class);
				await entity.setHealth(Math.round(
					(entity.health / await playerClass.getMaxHealthValue(entity.Player.level))
					* await newClass.getMaxHealthValue(entity.Player.level)))
				entity.Player.addMoney(-selectedClass.price);
				await Promise.all([
					entity.save(),
					entity.Player.save()
				]);
				log(entity.discordUser_id + " bought the class " + newClass.en);
				return message.channel.send(
					new discord.MessageEmbed()
						.setColor(JsonReader.bot.embed.default)
						.setAuthor(
							format(JsonReader.commands.class.getTranslation(language).success, {
								pseudo: message.author.username,
							}),
							message.author.displayAvatarURL()
						)
						.setDescription(JsonReader.commands.class.getTranslation(language).newClass + selectedClass.getName(language))
				);
			}
		}
		sendErrorMessage(message.author, message.channel, language, JsonReader.commands.class.getTranslation(language).error.canceledPurchase);
	});

	await Promise.all([
		confirmMessage.react(MENU_REACTION.ACCEPT),
		confirmMessage.react(MENU_REACTION.DENY),
	]);
}

/**
 * @param {*} price - The item price
 */
const canBuy = function (price, player) {
	return player.money >= price;
};


module.exports = {
	commands: [
		{
			name: 'class',
			func: ClassCommand,
			aliases: ['c', 'classes', 'classe']
		}
	]
};