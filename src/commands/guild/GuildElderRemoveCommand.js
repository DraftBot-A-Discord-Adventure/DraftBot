/**
 * remove guild elder
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildElderRemoveCommand = async (language, message) => {
	let entity;
	let guild;
	const elderRemoveEmbed = new discord.MessageEmbed();

	[entity] = await Entities.getOrRegister(message.author.id);

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD], entity) !== true)
		return;

	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	// search for a user's guild
	try {
		guild = await Guilds.getById(entity.Player.guild_id);
	} catch (error) {
		guild = null;
	}

	if (guild == null) {
		// not in a guild
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildElder.getTranslation(language).notInAguild);
	}

	if (guild.chief_id !== entity.id) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildElder.getTranslation(language).notChiefError);
	}

	elderRemoveEmbed.setAuthor(
		format(
			JsonReader.commands.guildElderRemove.getTranslation(language)
				.elderRemoveTitle,
			{
				pseudo: message.author.username,
			}
		),
		message.author.displayAvatarURL()
	);
	elderRemoveEmbed.setDescription(
		format(
			JsonReader.commands.guildElderRemove.getTranslation(language).elderRemove,
			{
				guildName: guild.name,
			}
		)
	);

	const msg = await message.channel.send(elderRemoveEmbed);

	const confirmEmbed = new discord.MessageEmbed();
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

	addBlockedPlayer(entity.discordUser_id, "guildElderRemove", collector);

	collector.on("end", async (reaction) => {
		removeBlockedPlayer(entity.discordUser_id);
		if (reaction.first()) {
			// a reaction exist
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				guild.elder_id = null;
				await Promise.all([guild.save()]);

				confirmEmbed.setAuthor(
					JsonReader.commands.guildElderRemove.getTranslation(language)
						.successElderRemoveTitle,

					message.author.displayAvatarURL()
				);
				confirmEmbed.setDescription(
					JsonReader.commands.guildElderRemove.getTranslation(language)
						.successElderRemove
				);
				return message.channel.send(confirmEmbed);
			}
		}

		// Cancel the creation
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildElderRemove.getTranslation(language).elderRemoveCancelled, true);
	});

	await Promise.all([
		msg.react(MENU_REACTION.ACCEPT),
		msg.react(MENU_REACTION.DENY),
	]);
};

module.exports = {
	commands: [
		{
			name: "guildelderremove",
			func: GuildElderRemoveCommand,
			aliases: ["gelderremove", "guildelderremove", "ger"],
		},
	],
};
