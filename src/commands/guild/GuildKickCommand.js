/**
 * Allow to kick a member from a guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildKickCommand = async(language, message, args) => {
	let kickedEntity;
	let guild;
	let kickedGuild;
	const choiceEmbed = new discord.MessageEmbed();

	const [entity] = await Entities.getOrRegister(message.author.id);

	try {
		[kickedEntity] = await Entities.getByArgs(args, message);
	}
	catch (error) {
		kickedEntity = null;
	}

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD], entity) !== true) {
		return;
	}


	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	if (kickedEntity === null) {
		// no user provided
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildKick.getTranslation(language).cannotGetKickedUser
		);
	}

	if (await sendBlockedError(kickedEntity, message.channel, language)) {
		return;
	}

	// search for a user's guild
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}

	if (guild === null) {
		// not in a guild
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildKick.getTranslation(language).notInAguild
		);
	}

	if (guild.chiefId !== entity.id) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildKick.getTranslation(language).notChiefError
		);
	}

	// search for a user's guild
	try {
		kickedGuild = await Guilds.getById(kickedEntity.Player.guildId);
	}
	catch (error) {
		kickedGuild = null;
	}

	if (kickedGuild === null || kickedGuild.id !== guild.id) {
		// not the same guild
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildKick.getTranslation(language).notInTheGuild
		);
	}

	if (kickedEntity.id === entity.id) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildKick.getTranslation(language).excludeHimself
		);
	}

	choiceEmbed.setAuthor(
		format(JsonReader.commands.guildKick.getTranslation(language).kickTitle, {
			pseudo: message.author.username
		}),
		message.author.displayAvatarURL()
	);
	choiceEmbed.setDescription(
		format(JsonReader.commands.guildKick.getTranslation(language).kick, {
			guildName: guild.name,
			kickedPseudo: await kickedEntity.Player.getPseudo(language)
		})
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

	addBlockedPlayer(entity.discordUserId, "guildKick", collector);

	collector.on("end", async(reaction) => {
		removeBlockedPlayer(entity.discordUserId);
		if (reaction.first()) {
			// a reaction exist
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				try {
					[kickedEntity] = await Entities.getByArgs(args, message);
					kickedGuild = await Guilds.getById(kickedEntity.Player.guildId);
				}
				catch (error) {
					kickedEntity = null;
					kickedGuild = null;
				}

				if (kickedGuild === null || kickedEntity === null) {
					// not the same guild
					return sendErrorMessage(
						message.author,
						message.channel,
						language,
						JsonReader.commands.guildKick.getTranslation(language).notInTheGuild
					);
				}
				kickedEntity.Player.guildId = null;

				await Promise.all([kickedEntity.save(), kickedEntity.Player.save()]);

				embed.setAuthor(
					format(
						JsonReader.commands.guildKick.getTranslation(language).successTitle,
						{
							kickedPseudo: await kickedEntity.Player.getPseudo(language),
							guildName: guild.name
						}
					)
				);
				embed.setDescription(
					JsonReader.commands.guildKick.getTranslation(language).kickSuccess
				);
				return message.channel.send(embed);
			}
		}

		// Cancel the kick
		return sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.guildKick.getTranslation(language).kickCancelled, {kickedPseudo: await kickedEntity.Player.getPseudo(language)}),true);
	});

	await Promise.all([
		msg.react(MENU_REACTION.ACCEPT),
		msg.react(MENU_REACTION.DENY)
	]);
};

module.exports = {
	commands: [
		{
			name: "guildkick",
			func: GuildKickCommand,
			aliases: ["gkick", "gk"]
		}
	]
};
