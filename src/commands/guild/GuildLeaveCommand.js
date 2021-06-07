/**
 * Allow to leave a guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildLeaveCommand = async(language, message) => {
	let guild;
	let elder;
	const confirmationEmbed = new discord.MessageEmbed();

	const [entity] = await Entities.getOrRegister(message.author.id);

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD], entity) !== true) {
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

	if (guild === null) {
		// not in a guild
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildLeave.getTranslation(language).notInAGuild
		);
	}

	if (guild.elderId) {
		elder = await Entities.getById(guild.elderId);
	}

	if (entity.id === guild.chiefId) {
		if (elder) {
			confirmationEmbed.setDescription(
				format(JsonReader.commands.guildLeave.getTranslation(language).leaveChiefDescWithElder, {
					guildName: guild.name,
					elderName: await elder.Player.getPseudo(language)
				})
			);
		}
		else {
			confirmationEmbed.setDescription(
				format(JsonReader.commands.guildLeave.getTranslation(language).leaveChiefDesc, {
					guildName: guild.name
				})
			);
		}
	}
	else {
		confirmationEmbed.setDescription(
			format(JsonReader.commands.guildLeave.getTranslation(language).leaveDesc, {
				guildName: guild.name
			})
		);
	}
	const msg = await message.channel.send(confirmationEmbed);

	const embed = new discord.MessageEmbed();
	const filterConfirm = (reaction, user) =>
		(reaction.emoji.name === MENU_REACTION.ACCEPT || reaction.emoji.name === MENU_REACTION.DENY) &&
			user.id === message.author.id
		;

	const collector = msg.createReactionCollector(filterConfirm, {
		time: COLLECTOR_TIME,
		max: 1
	});

	await addBlockedPlayer(entity.discordUserId, "guildLeave", collector);
	if (elder) {
		addBlockedPlayer(elder.discordUserId, "chiefGuildLeave", collector);
	}

	collector.on("end", async(reaction) => {
		removeBlockedPlayer(entity.discordUserId);
		if (elder) {
			removeBlockedPlayer(elder.discordUserId);
		}
		if (reaction.first()) {
			// a reaction exist
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				entity.Player.guildId = null;
				if (entity.id === guild.chiefId) {
					if (elder) {
						log(
							elder.discordUserId +
							" becomes the chief of  " +
							guild.name
						);
						guild.chiefId = elder.id;
						guild.elderId = null;
						await Promise.all([guild.save()]);
						message.channel.send(
							format(JsonReader.commands.guildLeave.getTranslation(language).newChiefTitle, {
								guild: guild.name
							})
						);
					}
					else {
						log(
							guild.name +
							" has been destroyed"
						);
						// the chief is leaving : destroy the guild
						await Players.update(
							{guildId: null},
							{
								where: {
									guildId: guild.id
								}
							}
						);
						for (const pet of guild.GuildPets) {
							pet.PetEntity.destroy();
							pet.destroy();
						}
						await Guilds.destroy({
							where: {
								id: guild.id
							}
						});
					}
				}

				await Promise.all([entity.save(), entity.Player.save()]);

				embed.setAuthor(
					format(JsonReader.commands.guildLeave.getTranslation(language).successTitle, {
						pseudo: message.author.username,
						guildName: guild.name
					}),
					message.author.displayAvatarURL()
				);
				embed.setDescription(JsonReader.commands.guildLeave.getTranslation(language).leavingSuccess);
				return message.channel.send(embed);
			}
		}

		// Cancel leaving
		return sendErrorMessage(
			message.author, message.channel, language, format(JsonReader.commands.guildLeave.getTranslation(language).leavingCancelled, {
				guildName: guild.name
			}), true
		);
	});

	await Promise.all([msg.react(MENU_REACTION.ACCEPT), msg.react(MENU_REACTION.DENY)]);
};

module.exports = {
	commands: [
		{
			name: "guildleave",
			func: GuildLeaveCommand,
			aliases: ["gleave", "gl"]
		}
	]
};
