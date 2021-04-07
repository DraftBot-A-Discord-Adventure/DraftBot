/**
 * Allow to exchange the object that is in the player backup slot within the one that is active
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const UnlockCommand = async (language, message, args) => {
  let [entity] = await Entities.getOrRegister(message.author.id); //Loading player

  if (
		(await canPerformCommand(
			message,
			language,
			PERMISSION.ROLE.ALL,
			[EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED],
			entity
		)) !== true
	) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

  try {
		[lockedEntity] = await Entities.getByArgs(args, message);
	} catch (error) {
		lockedEntity = null;
	}

	if (lockedEntity == null) {
		// no user provided
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.unlock.getTranslation(language).cannotGetlockedUser
		);
	}
	if (lockedEntity.effect !== EFFECT.LOCKED) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.unlock.getTranslation(language).userNotLocked, 
		);
	}
	if (entity.Player.money < UNLOCK.PRICE_FOR_UNLOCK) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			format(JsonReader.commands.unlock.getTranslation(language).noMoney, {
				money: UNLOCK.PRICE_FOR_UNLOCK - entity.Player.money,
				pseudo: await lockedEntity.Player.getPseudo(language),
			})
		);
	}

	const embed = new discord.MessageEmbed()
		.setColor(JsonReader.bot.embed.default)
		.setAuthor(format(JsonReader.commands.unlock.getTranslation(language).unlockTitle, {
			pseudo: message.author.username,
		}), message.author.displayAvatarURL())
		.setDescription(format(JsonReader.commands.unlock.getTranslation(language).confirmUnlock, {
			pseudo: await lockedEntity.Player.getPseudo(language),
			price: UNLOCK.PRICE_FOR_UNLOCK
		}));
	const unlockMessage = await message.channel.send(embed);

	const filter = (reaction, user) => {
		return ((reaction.emoji.name === MENU_REACTION.ACCEPT || reaction.emoji.name === MENU_REACTION.DENY) && user.id === message.author.id);
	};

	const collector = unlockMessage.createReactionCollector(filter, {
		time: 30000,
		max: 1,
	});

	addBlockedPlayer(entity.discordUser_id, "unlock", collector);

	collector.on('end', async (reaction) => {
		removeBlockedPlayer(entity.discordUser_id);
		if (reaction.first()) { // a reaction exist
			[entity] = await Entities.getOrRegister(message.mentions.users.first().id); //released entity
			[player] = await Entities.getOrRegister(message.author.id); // message author
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				entity.effect = EFFECT.SMILEY //Set free
				player.Player.addMoney(-UNLOCK.PRICE_FOR_UNLOCK); //Remove money
				await Promise.all([
					entity.save(),
					entity.Player.save(),
					player.save(),
					player.Player.save()
				]);
				log(entity.discordUser_id + " has been released by" + message.author.id);
				const successEmbed = new discord.MessageEmbed();
			successEmbed.setAuthor(format(JsonReader.commands.unlock.getTranslation(language).unlockedTitle, {
				pseudo: message.author.username
			}),
			message.author.displayAvatarURL());
			successEmbed.setDescription(format(JsonReader.commands.unlock.getTranslation(language).unlockSuccess, {
				pseudo: await entity.Player.getPseudo(language),
			}));
			await message.channel.send(successEmbed);
			};
	}
	await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.unlock.getTranslation(language).unlockCanceled);
})
		
		try {
			await Promise.all([
				unlockMessage.react(MENU_REACTION.ACCEPT),
				unlockMessage.react(MENU_REACTION.DENY),
			]);
		} catch (e) {
		}
}


	module.exports = {
		commands: [
			{
				name: 'unlock',
				func: UnlockCommand,
				aliases: ['bail', 'release']
			}
		]
	};
