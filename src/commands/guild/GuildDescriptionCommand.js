module.exports.help = {
	name : "guilddescription"
};

/**
 * Change guild description
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
module.exports.execute = async (message, language, args) => {
	let guild;
	let entity;
	const confirmationEmbed = new discord.MessageEmbed();

	[entity] = await Entities.getByArgs(args, message);
	if (entity === null) {
		[entity] = await Entities.getOrRegister(message.author.id);
	}

	guild = await Guilds.getById(entity.Player.guild_id);

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

	if (guild == null) {
		// not in a guild
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildDescription.getTranslation(language).notInAguild
		);
	}

	if (args.length <= 0) {
		//no description was given
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			format(
				JsonReader.commands.guildDescription.getTranslation(language)
					.noDescriptionGiven
			)
		);
	}

	if ((entity.id !== guild.chief_id) && (entity.id !== guild.elder_id)) {
		//not the chief
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildDescription.getTranslation(language)
				.notAuthorizedError
		);
	}

	const description = args.join(" ");
	const regexAllowed = RegExp(
		/^[A-Za-z0-9 ÇçÜüÉéÂâÄäÀàÊêËëÈèÏïÎîÔôÖöÛû"',.;:?!]+$/
	);
	const regexSpecialCases = RegExp(/^[0-9 ]+$|( {2})+/);
	if (
		!(
			regexAllowed.test(description) &&
			!regexSpecialCases.test(description) &&
			description.length >= GUILD.MIN_DESCRIPTION_LENGTH &&
			description.length <= GUILD.MAX_DESCRIPTION_LENGTH
		)
	) {
		//name does not follow the rules
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			format(
				JsonReader.commands.guildDescription.getTranslation(language)
					.invalidDescription,
				{
					min: GUILD.MIN_DESCRIPTION_LENGTH,
					max: GUILD.MAX_DESCRIPTION_LENGTH,
				}
			)
		);
	}

	confirmationEmbed.setAuthor(
		format(
			JsonReader.commands.guildDescription.getTranslation(language)
				.changeDescriptionTitle,
			{ pseudo: message.author.username }
		),
		message.author.displayAvatarURL()
	);
	confirmationEmbed.setDescription(
		format(
			JsonReader.commands.guildDescription.getTranslation(language)
				.changeDescriptionConfirm,
			{
				description: description,
			}
		)
	);
	confirmationEmbed.setFooter(
		JsonReader.commands.guildDescription.getTranslation(language)
			.changeDescriptionFooter,
		null
	);

	const msg = await message.channel.send(confirmationEmbed);

	const embed = new discord.MessageEmbed();
	const filterConfirm = (reaction, user) => {
		return (
			(reaction.emoji.name === MENU_REACTION.ACCEPT ||
				reaction.emoji.name === MENU_REACTION.DENY) &&
			user.id === message.author.id
		);
	};

	const collector = msg.createReactionCollector(filterConfirm, {
		time: COLLECTOR_TIME,
		max: 1,
	});

	addBlockedPlayer(entity.discordUser_id, "descriptionEdit", collector);

	collector.on("end", async (reaction) => {
		removeBlockedPlayer(entity.discordUser_id);
		if (reaction.first()) {
			// a reaction exist
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				[entity] = await Entities.getOrRegister(message.author.id);
				try {
					guild = await Guilds.getById(entity.Player.guild_id);
				} catch (error) {
					guild = null;
				}
				if (guild == null) {
					// guild is destroy
					return sendErrorMessage(
						message.author,
						message.channel,
						language,
						JsonReader.commands.guildDescription.getTranslation(language)
							.guildDestroy
					);
				}
				guild.guildDescription = args.join(" ");

				await Promise.all([guild.save()]);

				embed.setAuthor(
					format(
						JsonReader.commands.guildDescription.getTranslation(language)
							.editSuccessTitle
					),
					message.author.displayAvatarURL()
				);
				return message.channel.send(embed);
			}
		}

		// Cancel the creation
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			format(
				JsonReader.commands.guildDescription.getTranslation(language)
					.editCancelled
			)
		);
	});

	await Promise.all([
		msg.react(MENU_REACTION.ACCEPT),
		msg.react(MENU_REACTION.DENY),
	]);
};