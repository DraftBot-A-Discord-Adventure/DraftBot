const Maps = require("../../core/Maps");

/**
 * Allow to free someone from the lock effect
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const UnlockCommand = async(language, message, args) => {
	let [entity] = await Entities.getOrRegister(message.author.id); // Loading player

	if (message.mentions.users.first()) {
		if (message.mentions.users.first().id === message.author.id) {
			return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.unlock.getTranslation(language).unlockHimself);
		}
	}

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity) !== true) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const [lockedEntity] = await Entities.getByArgs(args, message);
	if (lockedEntity === null) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.unlock.getTranslation(language).cannotGetlockedUser);
	}

	if (lockedEntity.Player.effect !== EFFECT.LOCKED) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.unlock.getTranslation(language).userNotLocked);
	}
	if (entity.Player.money < UNLOCK.PRICE_FOR_UNLOCK) {
		return sendErrorMessage(message.author, message.channel, language,
			format(JsonReader.commands.unlock.getTranslation(language).noMoney, {
				money: UNLOCK.PRICE_FOR_UNLOCK - entity.Player.money,
				pseudo: await lockedEntity.Player.getPseudo(language)
			})
		);
	}

	const embed = new discord.MessageEmbed()
		.setColor(JsonReader.bot.embed.default)
		.setAuthor(format(JsonReader.commands.unlock.getTranslation(language).unlockTitle, {
			pseudo: message.author.username
		}), message.author.displayAvatarURL())
		.setDescription(format(JsonReader.commands.unlock.getTranslation(language).confirmUnlock, {
			pseudo: await lockedEntity.Player.getPseudo(language),
			price: UNLOCK.PRICE_FOR_UNLOCK
		}));
	const unlockMessage = await message.channel.send(embed);

	const filter = (reaction, user) => (reaction.emoji.name === MENU_REACTION.ACCEPT || reaction.emoji.name === MENU_REACTION.DENY) && user.id === message.author.id;

	const collector = unlockMessage.createReactionCollector(filter, {
		time: 30000,
		max: 1
	});

	addBlockedPlayer(entity.discordUserId, "unlock", collector);

	collector.on("end", async(reaction) => {
		removeBlockedPlayer(entity.discordUserId);
		if (reaction.first()) { // a reaction exist
			[entity] = await Entities.getOrRegister(message.mentions.users.first().id); // released entity
			[player] = await Entities.getOrRegister(message.author.id); // message author
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				await Maps.removeEffect(entity.Player);
				player.Player.addMoney(-UNLOCK.PRICE_FOR_UNLOCK); // Remove money
				await Promise.all([
					entity.save(),
					entity.Player.save(),
					player.save(),
					player.Player.save()
				]);
				log(entity.discordUserId + " has been released by" + message.author.id);
				const successEmbed = new discord.MessageEmbed();
				successEmbed.setAuthor(format(JsonReader.commands.unlock.getTranslation(language).unlockedTitle, {
					pseudo: await entity.Player.getPseudo(language)
				}),
				message.author.displayAvatarURL());
				successEmbed.setDescription(format(JsonReader.commands.unlock.getTranslation(language).unlockSuccess, {
					pseudo: await entity.Player.getPseudo(language)
				}));
				return await message.channel.send(successEmbed);
			}
		}
		await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.unlock.getTranslation(language).unlockCanceled, true);
	});

	try {
		await Promise.all([
			unlockMessage.react(MENU_REACTION.ACCEPT),
			unlockMessage.react(MENU_REACTION.DENY)
		]);
	}
	catch (e) {
		log("Error while reaction to unlock message: " + e);
	}
};


module.exports = {
	commands: [
		{
			name: "unlock",
			func: UnlockCommand,
			aliases: ["bail", "release"]
		}
	]
};
