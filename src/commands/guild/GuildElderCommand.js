import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entities} from "../../core/models/Entity";
import {Guilds} from "../../core/models/Guild";

module.exports.commandInfo = {
	name: "guildelder",
	aliases: ["gelder"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD],
	guildRequired: true,
	guildPermissions: 3
};

/**
 * add or change guild elder
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */

const GuildElderCommand = async (message, language, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	let elderEntity;
	let guild;
	let elderGuild;
	const elderAddEmbed = new DraftBotEmbed();

	guild = await Guilds.getById(entity.Player.guildId);
	try {
		elderEntity = message.mentions.users.last() ? await Entities.getByDiscordUserId(message.mentions.users.last().id) : null;
	}
	catch (error) {
		elderEntity = null;
	}

	if (elderEntity === null) {
		// no user provided
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildElder.getTranslation(language).cannotGetElderUser
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

	try {
		[elderEntity] = await Entities.getByArgs(args, message);
		elderGuild = await Guilds.getById(elderEntity.Player.guildId);
	}
	catch (error) {
		elderEntity = null;
		elderGuild = null;
	}

	if (elderGuild === null || elderEntity === null || elderGuild.id !== guild.id) {
		// elder is not in guild
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildElder.getTranslation(language).notInTheGuild
		);
	}

	if (guild.chiefId === elderEntity.id) {
		// chief cannot be the elder
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildElder.getTranslation(language).chiefError
		);
	}

	elderAddEmbed.setAuthor(
		format(
			JsonReader.commands.guildElder.getTranslation(language).elderAddTitle,
			{
				pseudo: message.author.username
			}
		),
		message.author.displayAvatarURL()
	);
	elderAddEmbed.setDescription(
		format(JsonReader.commands.guildElder.getTranslation(language).elderAdd, {
			elder: message.mentions.users.last(),
			guildName: guild.name
		})
	);

	const msg = await message.channel.send({ embeds: [elderAddEmbed] });

	const confirmEmbed = new DraftBotEmbed();
	const filterConfirm = (reaction, user) =>
		(reaction.emoji.name === MENU_REACTION.ACCEPT ||
				reaction.emoji.name === MENU_REACTION.DENY) &&
			user.id === message.author.id
		;

	const collector = msg.createReactionCollector({
		filter: filterConfirm,
		time: COLLECTOR_TIME,
		max: 1
	});

	addBlockedPlayer(entity.discordUserId, "guildElder", collector);

	collector.on("end", async (reaction) => {
		removeBlockedPlayer(entity.discordUserId);
		if (reaction.first()) {
			// a reaction exist
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				try {
					[elderEntity] = await Entities.getByArgs(args, message);
					elderGuild = await Guilds.getById(elderEntity.Player.guildId);
				}
				catch (error) {
					elderEntity = null;
					elderGuild = null;
				}

				if (elderGuild === null || elderEntity === null || elderGuild.id !== guild.id) {
					// elder is not in guild
					return sendErrorMessage(
						message.author,
						message.channel,
						language,
						JsonReader.commands.guildElder.getTranslation(language)
							.notInTheGuild
					);
				}
				try {
					guild = await Guilds.getById(entity.Player.guildId);
				}
				catch (error) {
					guild = null;
				}
				if (guild === null) {
					// guild is destroy
					return sendErrorMessage(
						message.author,
						message.channel,
						language,
						format(
							JsonReader.commands.guildElder.getTranslation(language)
								.guildDestroy,
							{
								guildName: guild.name
							}
						)
					);
				}
				guild.elderId = elderEntity.id;
				await Promise.all([guild.save()]);
				confirmEmbed.setAuthor(
					format(
						JsonReader.commands.guildElder.getTranslation(language)
							.successElderAddTitle,
						{
							pseudo: message.mentions.users.last().username,
							guildName: guild.name
						}
					),
					message.mentions.users.last().displayAvatarURL()
				);
				confirmEmbed.setDescription(
					JsonReader.commands.guildElder.getTranslation(language)
						.successElderAdd
				);
				return message.channel.send({ embeds: [confirmEmbed] });
			}
		}

		// Cancel the creation
		return sendErrorMessage(message.mentions.users.last(), message.channel, language,
			format(JsonReader.commands.guildElder.getTranslation(language).elderAddCancelled, {guildName: guild.name}), true);
	});

	await Promise.all([
		msg.react(MENU_REACTION.ACCEPT),
		msg.react(MENU_REACTION.DENY)
	]);
};

module.exports.execute = GuildElderCommand;