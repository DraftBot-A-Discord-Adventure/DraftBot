module.exports.help = {
	name: "guildcreate"
};

/**
 * Allow to Create a guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
module.exports.execute = async (message, language, args) => {
	let guild;
	const choiceEmbed = new discord.MessageEmbed();

	const [entity] = await Entities.getOrRegister(message.author.id);
	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity, GUILD.REQUIRED_LEVEL) !== true) {
		return;
	}

	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	// search for a user's guild
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}

	if (guild !== null) {
		// already in a guild
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildCreate.getTranslation(language).alreadyInAGuild);
	}

	const askedName = args.join(" ");

	if (askedName.length < 1) {
		// no name provided
		return sendErrorMessage(
			message.author, message.channel, language, JsonReader.commands.guildCreate.getTranslation(language).noNameProvided
		);
	}

	if (!checkNameString(askedName, GUILD.MIN_GUILD_NAME_SIZE, GUILD.MAX_GUILD_NAME_SIZE)) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			format(JsonReader.commands.guildCreate.getTranslation(language).invalidName + "\n" + JsonReader.error.getTranslation(language).nameRules, {
				min: GUILD.MIN_GUILD_NAME_SIZE,
				max: GUILD.MAX_GUILD_NAME_SIZE
			}));
	}

	try {
		guild = await Guilds.getByName(args.join(" "));
	}
	catch (error) {
		guild = null;
	}

	if (guild !== null) {
		// the name is already used
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildCreate.getTranslation(language).nameAlreadyUsed
		);
	}

	addBlockedPlayer(entity.discordUserId, "guildCreate");
	choiceEmbed.setAuthor(
		format(JsonReader.commands.guildCreate.getTranslation(language).buyTitle, {
			pseudo: message.author.username
		}),
		message.author.displayAvatarURL()
	);
	choiceEmbed.setDescription(
		format(
			JsonReader.commands.guildCreate.getTranslation(language).buyConfirm,
			{
				guildName: askedName,
				price: JsonReader.commands.guildCreate.guildCreationPrice
			}
		)
	);
	choiceEmbed.setFooter(
		JsonReader.commands.guildCreate.getTranslation(language).buyFooter,
		null
	);

	const msg = await message.channel.send(choiceEmbed);
	embed = new discord.MessageEmbed();
	const filterConfirm = (reaction, user) =>
		(reaction.emoji.name === MENU_REACTION.ACCEPT ||
				reaction.emoji.name === MENU_REACTION.DENY) &&
			user.id === message.author.id
		;

	const collector = msg.createReactionCollector(filterConfirm, {
		time: COLLECTOR_TIME,
		max: 1
	});

	addBlockedPlayer(entity.discordUserId, "guildCreate", collector);

	collector.on("end", async (reaction) => {
		removeBlockedPlayer(entity.discordUserId);
		if (reaction.first()) {
			// a reaction exist
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				try {
					guild = await Guilds.getByName(args.join(" "));
				}
				catch (error) {
					guild = null;
				}
				if (guild !== null) {
					// the name is already used
					return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildCreate.getTranslation(language).nameAlreadyUsed);
				}
				if (
					entity.Player.money <
					JsonReader.commands.guildCreate.guildCreationPrice
				) {
					return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildCreate.getTranslation(language).notEnoughMoney);
				}

				const newGuild = await Guilds.create({
					name: askedName,
					chiefId: entity.id
				});

				entity.Player.guildId = newGuild.id;
				entity.Player.addMoney(
					-JsonReader.commands.guildCreate.guildCreationPrice
				);
				newGuild.updateLastDailyAt();
				await Promise.all([
					newGuild.save(),
					entity.save(),
					entity.Player.save()
				]);

				embed.setAuthor(
					format(
						JsonReader.commands.guildCreate.getTranslation(language).createTitle, {pseudo: message.author.username}),
					message.author.displayAvatarURL()
				);
				embed.setDescription(
					format(
						JsonReader.commands.guildCreate.getTranslation(language).createSuccess, {guildName: askedName})
				);
				return message.channel.send(embed);
			}
		}

		// Cancel the creation
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildCreate.getTranslation(language).creationCancelled, true);
	});

	await Promise.all([
		msg.react(MENU_REACTION.ACCEPT),
		msg.react(MENU_REACTION.DENY)
	]);
};