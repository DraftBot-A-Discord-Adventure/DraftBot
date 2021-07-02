import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";

module.exports.help = {
	name: "guildadd",
	aliases: ["gadd", "ga"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED],
	guildRequired: true,
	guildPermissions: 2
};

/**
 * Allow to add a member to a guild
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildAddCommand = async (message, language, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	let invitedEntity;
	let invitedGuild;

	try {
		[invitedEntity] = await Entities.getByArgs(args, message);
	}
	catch (error) {
		invitedEntity = null;
	}

	if (invitedEntity === null) {
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
					comeIn: GUILD.REQUIRED_LEVEL - invitedEntity.Player.level > 1
						? `${GUILD.REQUIRED_LEVEL - invitedEntity.Player.level} niveaux`
						: `${GUILD.REQUIRED_LEVEL - invitedEntity.Player.level} niveau`
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

	let guild = await Guilds.getById(entity.Player.guildId);

	// search for a user's guild
	try {
		invitedGuild = await Guilds.getById(invitedEntity.Player.guildId);
	}
	catch (error) {
		invitedGuild = null;
	}

	if (invitedGuild !== null) {
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

	const msg = await message.channel.send(new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.guildAdd.getTranslation(language).invitationTitle, message.mentions.users.last())
		.setDescription(format(JsonReader.commands.guildAdd.getTranslation(language).invitation, {
			guildName: guild.name
		})));

	const endCallback = async (msg) => {
		removeBlockedPlayer(invitedEntity.discordUserId);
		if (msg.isValidated()) {
			try {
				guild = await Guilds.getById(entity.Player.guildId);
			}
			catch (error) {
				guild = null;
			}
			if (guild === null) {
				// guild is destroy
				return sendErrorMessage(
					message.mentions.users.last(),
					message.channel,
					language,
					JsonReader.commands.guildAdd.getTranslation(language).guildDestroy
				);
			}
			invitedEntity.Player.guildId = guild.id;
			guild.updateLastDailyAt();

			await Promise.all([
				guild.save(),
				invitedEntity.save(),
				invitedEntity.Player.save()
			]);

			return message.channel.send(
				new DraftBotEmbed()
					.setAuthor(format(JsonReader.commands.guildAdd.getTranslation(language).successTitle, {
						pseudo: message.mentions.users.last().username,
						guildName: guild.name
					}),
					message.mentions.users.last().displayAvatarURL())
					.setDescription(JsonReader.commands.guildAdd.getTranslation(language).invitationSuccess)
			);
		}

		// Cancel the creation
		return sendErrorMessage(message.mentions.users.last(), message.channel, language,
			format(JsonReader.commands.guildAdd.getTranslation(language).invitationCancelled, {guildName: guild.name}), true);
	};

	const validationEmbed = new DraftBotValidateReactionMessage(
		message.author,
		endCallback
	);
	await validationEmbed.send(message.channel);

	addBlockedPlayer(invitedEntity.discordUserId, "guildAdd", validationEmbed.collector);
};

module.exports.execute = GuildAddCommand;