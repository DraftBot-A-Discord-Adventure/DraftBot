import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entities} from "../../core/models/Entity";
import {Guilds} from "../../core/models/Guild";
import Player, {Players} from "../../core/models/Player";

module.exports.commandInfo = {
	name: "guild",
	aliases: ["g"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

/**
 * Allow to display the info of a guild
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildCommand = async (message, language, args) => {
	let entity;
	let guild;

	[entity] = await Entities.getByArgs(args, message);
	if (entity === null) {
		[entity] = await Entities.getOrRegister(message.author.id);
	}

	if (args.length > 0 && message.mentions.users.last() === undefined) {
		// args is the name of a guild
		try {
			guild = await Guilds.getByName(args.join(" "));
		}
		catch (error) {
			guild = null;
		}
	}
	else {
		if (message.mentions.users.last() !== undefined) {
			[entity] = await Entities.getOrRegister(
				message.mentions.users.last().id
			);
		}
		// search for a user's guild
		try {
			guild = await Guilds.getById(entity.Player.guildId);
		}
		catch (error) {
			guild = null;
		}
	}

	const embed = new DraftBotEmbed();

	if (guild === null) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guild.getTranslation(language).noGuildException
		);
	}
	const members = await Entities.getByGuild(guild.id);

	const chief = await Player.findOne({where: {id: guild.chiefId}});

	let membersInfos = "";

	for (const member of members) {
		// if member is the owner of guild
		if (member.Player.id === guild.chiefId) {
			membersInfos += format(
				JsonReader.commands.guild.getTranslation(language).chiefinfos,
				{
					pseudo: await member.Player.getPseudo(language),
					ranking: (await Players.getById(member.Player.id))[0].rank,
					score: member.Player.score
				}
			);
		}
		else if (member.Player.id === guild.elderId) {
			membersInfos += format(
				JsonReader.commands.guild.getTranslation(language).elderinfos,
				{
					pseudo: await member.Player.getPseudo(language),
					ranking: (await Players.getById(member.Player.id))[0].rank,
					score: member.Player.score
				}
			);
		}
		else {
			membersInfos += format(
				JsonReader.commands.guild.getTranslation(language).memberinfos,
				{
					pseudo: await member.Player.getPseudo(language),
					ranking: (await Players.getById(member.Player.id))[0].rank,
					score: member.Player.score
				}
			);
		}
	}

	embed.setThumbnail(JsonReader.commands.guild.icon);

	embed.setTitle(
		format(JsonReader.commands.guild.getTranslation(language).title, {
			guildName: guild.name,
			pseudo: await chief.getPseudo(language)
		})
	);

	if (guild.guildDescription) {
		embed.setDescription(
			format(
				JsonReader.commands.guild.getTranslation(language).description,
				{
					description: guild.guildDescription
				}
			)
		);
	}
	embed.addField(
		format(JsonReader.commands.guild.getTranslation(language).members, {
			memberCount: members.length,
			maxGuildMembers: GUILD.MAX_GUILD_MEMBER
		}),
		membersInfos
	);
	if (!guild.isAtMaxLevel()) {
		embed.addField(
			format(
				JsonReader.commands.guild.getTranslation(language).experience,
				{
					xp: guild.experience,
					xpToLevelUp: guild.getExperienceNeededToLevelUp(),
					level: guild.level
				}
			),
			progressBar(guild.experience, guild.getExperienceNeededToLevelUp())
		);
	}
	else {
		embed.addField(
			JsonReader.commands.guild.getTranslation(language).lvlMax,
			progressBar(1, 1)
		);
	}

	// embed.addField(Text.commands.guild.star + experience + Text.commands.guild.expSeparator + experienceToLevelUp
	//    + Text.commands.guild.guildLevel + level, Text.commands.guild.style + progressBar.createBar() + Text.commands.guild.style);

	message.channel.send({ embeds: [embed] });
};

module.exports.execute = GuildCommand;