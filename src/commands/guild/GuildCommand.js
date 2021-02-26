/**
 * Allow to display the info of a guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildCommand = async (language, message, args) => {
	let entity;
	let guild;

	[entity] = await Entities.getByArgs(args, message);
	if (entity === null) {
		[entity] = await Entities.getOrRegister(message.author.id);
	}

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

	if (args.length > 0 && message.mentions.users.last() === undefined) {
		// args is the name of a guild
		try {
			guild = await Guilds.getByName(args.join(" "));
		} catch (error) {
			guild = null;
		}
	} else {
		if (message.mentions.users.last() !== undefined) {
			[entity] = await Entities.getOrRegister(
				message.mentions.users.last().id
			);
		}
		// search for a user's guild
		try {
			guild = await Guilds.getById(entity.Player.guild_id);
		} catch (error) {
			guild = null;
		}
	}

	const embed = new discord.MessageEmbed();

	if (guild === null) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guild.getTranslation(language).noGuildException
		);
	}
	const members = await Entities.getByGuild(guild.id);

	const chief = await Players.findOne({where: {id: guild.chief_id}});

	let membersInfos = "";

	for (const member of members) {
		// if member is the owner of guild
		if (member.Player.id === guild.chief_id) {
			membersInfos += format(
				JsonReader.commands.guild.getTranslation(language).chiefinfos,
				{
					pseudo: await member.Player.getPseudo(language),
					ranking: (await Players.getById(member.Player.id))[0].rank,
					score: member.Player.score,
				}
			);
		} else if (member.Player.id === guild.elder_id) {
			membersInfos += format(
				JsonReader.commands.guild.getTranslation(language).elderinfos,
				{
					pseudo: await member.Player.getPseudo(language),
					ranking: (await Players.getById(member.Player.id))[0].rank,
					score: member.Player.score,
				}
			);
		} else {
			membersInfos += format(
				JsonReader.commands.guild.getTranslation(language).memberinfos,
				{
					pseudo: await member.Player.getPseudo(language),
					ranking: (await Players.getById(member.Player.id))[0].rank,
					score: member.Player.score,
				}
			);
		}
	}

	embed.setThumbnail(JsonReader.commands.guild.icon);

	embed.setTitle(
		format(JsonReader.commands.guild.getTranslation(language).title, {
			guildName: guild.name,
			pseudo: await chief.getPseudo(language),
		})
	);

	if (guild.guildDescription) {
		embed.setDescription(
			format(
				JsonReader.commands.guild.getTranslation(language).description,
				{
					description: guild.guildDescription,
				}
			)
		);
	}
	embed.addField(
		format(JsonReader.commands.guild.getTranslation(language).members, {
			memberCount: members.length,
			maxGuildMembers: GUILD.MAX_GUILD_MEMBER,
		}),
		membersInfos
	);
	if (guild.level < 100) {
		embed.addField(
			format(
				JsonReader.commands.guild.getTranslation(language).experience,
				{
					xp: guild.experience,
					xpToLevelUp: guild.getExperienceNeededToLevelUp(),
					level: guild.level,
				}
			),
			progressBar(guild.experience, guild.getExperienceNeededToLevelUp())
		);
	} else {
		embed.addField(
			JsonReader.commands.guild.getTranslation(language).lvlMax,
			progressBar(1, 1)
		);
	}

	// embed.addField(Text.commands.guild.star + experience + Text.commands.guild.expSeparator + experienceToLevelUp
	//    + Text.commands.guild.guildLevel + level, Text.commands.guild.style + progressBar.createBar() + Text.commands.guild.style);

	message.channel.send(embed);
};

module.exports = {
	commands: [
		{
			name: "guild",
			func: GuildCommand,
			aliases: ["g"],
		},
	],
};
