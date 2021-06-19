module.exports.help = {
	name: "guildelderremove",
	aliases: ["gelderremove", "ger"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD],
	guildRequired: true
};

/**
 * remove guild elder
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildElderRemoveCommand = async (message, language, entity) => {
	const guild = await Guilds.getById(entity.Player.guildId);
	const elderRemoveEmbed = new discord.MessageEmbed();

	if (guild.chiefId !== entity.id) {
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildElder.getTranslation(language).notChiefError);
	}

	elderRemoveEmbed.setAuthor(
		format(
			JsonReader.commands.guildElderRemove.getTranslation(language)
				.elderRemoveTitle,
			{
				pseudo: message.author.username
			}
		),
		message.author.displayAvatarURL()
	);
	elderRemoveEmbed.setDescription(
		format(
			JsonReader.commands.guildElderRemove.getTranslation(language).elderRemove,
			{
				guildName: guild.name
			}
		)
	);

	const msg = await message.channel.send(elderRemoveEmbed);

	const confirmEmbed = new discord.MessageEmbed();
	const filterConfirm = (reaction, user) =>
		(reaction.emoji.name === MENU_REACTION.ACCEPT ||
				reaction.emoji.name === MENU_REACTION.DENY) &&
			user.id === message.author.id
		;

	const collector = msg.createReactionCollector(filterConfirm, {
		time: COLLECTOR_TIME,
		max: 1
	});

	addBlockedPlayer(entity.discordUserId, "guildElderRemove", collector);

	collector.on("end", async (reaction) => {
		removeBlockedPlayer(entity.discordUserId);
		if (reaction.first()) {
			// a reaction exist
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				guild.elderId = null;
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
		msg.react(MENU_REACTION.DENY)
	]);
};

module.exports.execute = GuildElderRemoveCommand;