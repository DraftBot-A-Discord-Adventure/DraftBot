/**
 * Allow to add a member to a guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildAddCommand = async (language, message, args) => {
	let entity;
	let invitedEntity;
	let guild;
	let invitedGuild;
	const invitationEmbed = new discord.MessageEmbed();

	[entity] = await Entities.getOrRegister(message.author.id);

	if (
		(await canPerformCommand(
			message,
			language,
			PERMISSION.ROLE.ALL,
			[EFFECT.BABY, EFFECT.DEAD],
			entity
		)) !== true
	) {
		return;
	}

	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	try {
		[invitedEntity] = await Entities.getByArgs(args, message);
	} catch (error) {
		invitedEntity = null;
	}

	if (invitedEntity == null) {
		// no user provided
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildAdd.getTranslation(language).cannotGetInvitedUser
		);
	}

	if (invitedEntity.Player.level < GUILD.REQUIRED_LEVEL) {
		// invited user is low level
		return await sendErrorMessage(
			message.author,
			message.channel,
			language,
			format(
				JsonReader.commands.guildAdd.getTranslation(language).levelTooLow,
				{
					pseudo: message.mentions.users.last(),
					level: GUILD.REQUIRED_LEVEL,
					playerLevel: invitedEntity.Player.level,
					comeIn:
						GUILD.REQUIRED_LEVEL - invitedEntity.Player.level > 1 ? `${GUILD.REQUIRED_LEVEL - invitedEntity.Player.level} niveaux` : `${GUILD.REQUIRED_LEVEL - invitedEntity.Player.level} niveau`,
				}
			)
		);
	}

	if (
		await sendBlockedError(
			message.mentions.users.last(),
			message.channel,
			language
		)
	) {
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
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildAdd.getTranslation(language).notInAguild
		);
	}

	if ((entity.id !== guild.chief_id) && (entity.id !== guild.elder_id)) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildAdd.getTranslation(language).notAuthorizedError
		);
	}

	// search for a user's guild
	try {
		invitedGuild = await Guilds.getById(invitedEntity.Player.guild_id);
	} catch (error) {
		invitedGuild = null;
	}

	if (invitedGuild != null) {
		// already in a guild
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildAdd.getTranslation(language).alreadyInAGuild
		);
	}

	const members = await Entities.getByGuild(guild.id);

	if (members.length === GUILD.MAX_GUILD_MEMBER) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildAdd.getTranslation(language).guildFull
		);
	}

	invitationEmbed.setAuthor(
		format(
			JsonReader.commands.guildAdd.getTranslation(language).invitationTitle,
			{
				pseudo: message.mentions.users.last().username,
			}
		),
		message.mentions.users.last().displayAvatarURL()
	);
	invitationEmbed.setDescription(
		format(JsonReader.commands.guildAdd.getTranslation(language).invitation, {
			guildName: guild.name,
		})
	);

	const msg = await message.channel.send(invitationEmbed);

	const embed = new discord.MessageEmbed();
	const filterConfirm = (reaction, user) => {
		return (
			(reaction.emoji.name == MENU_REACTION.ACCEPT ||
				reaction.emoji.name == MENU_REACTION.DENY) &&
			user.id === message.mentions.users.last().id
		);
	};

	const collector = msg.createReactionCollector(filterConfirm, {
		time: 120000,
		max: 1,
	});

	addBlockedPlayer(invitedEntity.discordUser_id, "guildAdd", collector);

	collector.on("end", async (reaction) => {
		removeBlockedPlayer(invitedEntity.discordUser_id);
		if (reaction.first()) {
			// a reaction exist
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				try {
					guild = await Guilds.getById(entity.Player.guild_id);
				} catch (error) {
					guild = null;
				}
				if (guild == null) {
					// guild is destroy
					return sendErrorMessage(
						message.mentions.users.last(),
						message.channel,
						language,
						JsonReader.commands.guildAdd.getTranslation(language).guildDestroy
					);
				}
				invitedEntity.Player.guild_id = guild.id;
				guild.updateLastDailyAt();

				await Promise.all([
					guild.save(),
					invitedEntity.save(),
					invitedEntity.Player.save(),
				]);

				embed.setAuthor(
					format(
						JsonReader.commands.guildAdd.getTranslation(language).successTitle,
						{
							pseudo: message.mentions.users.last().username,
							guildName: guild.name,
						}
					),
					message.mentions.users.last().displayAvatarURL()
				);
				embed.setDescription(
					JsonReader.commands.guildAdd.getTranslation(language)
						.invitationSuccess
				);
				return message.channel.send(embed);
			}
		}

		// Cancel the creation
		return sendErrorMessage(
			message.mentions.users.last(),
			message.channel,
			language,
			format(
				JsonReader.commands.guildAdd.getTranslation(language)
					.invitationCancelled,
				{
					guildName: guild.name,
				}
			)
		);
	});

	await Promise.all([
		msg.react(MENU_REACTION.ACCEPT),
		msg.react(MENU_REACTION.DENY),
	]);
};

module.exports = {
	commands: [
		{
			name: "guildadd",
			func: GuildAddCommand,
			aliases: ["gadd", "ga"],
		},
	],
};
