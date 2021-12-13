import {Entities} from "../../core/models/Entity";

module.exports.commandInfo = {
	name: "guildcreate",
	aliases: ["gcreate", "gc"],
	requiredLevel: GUILD.REQUIRED_LEVEL,
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

/**
 * Allow to Create a guild
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import Guild, {Guilds} from "../../core/models/Guild";
import {MissionsController} from "../../core/missions/MissionsController";

const GuildCreateCommand = async (message, language, args) => {
	let guild;
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}
	const [entity] = await Entities.getOrRegister(message.author.id);

	// search for a user's guild
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}

	if (guild !== null) {
		// already in a guild
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildCreate.getTranslation(language).alreadyInAGuild);
	}

	const askedName = args.join(" ");

	if (askedName.length < 1) {
		// no name provided
		return sendErrorMessage(
			message.author, message.channel, language, JsonReader.commands.guildCreate.getTranslation(language).noNameProvided
		);
	}

	if (!checkNameString(askedName, GUILD.MIN_GUILD_NAME_SIZE, GUILD.MAX_GUILD_NAME_SIZE)) {
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			format(JsonReader.commands.guildCreate.getTranslation(language).invalidName + "\n" + JsonReader.error.getTranslation(language).nameRules, {
				min: GUILD.MIN_GUILD_NAME_SIZE,
				max: GUILD.MAX_GUILD_NAME_SIZE
			}));
	}

	try {
		guild = await Guilds.getByName(args.join(" "));
	}
	catch (error) {
		guild = null;
	}

	if (guild !== null) {
		// the name is already used
		return sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.guildCreate.getTranslation(language).nameAlreadyUsed
		);
	}

	const endCallback = async (validateMessage) => {
		removeBlockedPlayer(entity.discordUserId);
		if (validateMessage.isValidated()) {
			try {
				guild = await Guilds.getByName(args.join(" "));
			}
			catch (error) {
				guild = null;
			}
			if (guild !== null) {
				// the name is already used
				return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildCreate.getTranslation(language).nameAlreadyUsed);
			}
			if (
				entity.Player.money <
					JsonReader.commands.guildCreate.guildCreationPrice
			) {
				return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildCreate.getTranslation(language).notEnoughMoney);
			}

			const newGuild = await Guild.create({
				name: askedName,
				chiefId: entity.id
			});

			entity.Player.guildId = newGuild.id;
			entity.Player.addMoney(entity, -JsonReader.commands.guildCreate.guildCreationPrice, message.channel, language);
			newGuild.updateLastDailyAt();
			await Promise.all([
				newGuild.save(),
				entity.save(),
				entity.Player.save()
			]);

			await MissionsController.update(entity.discordUserId, message.channel, language, "joinGuild");

			return message.channel.send({ embeds: [new DraftBotEmbed()
				.formatAuthor(JsonReader.commands.guildCreate.getTranslation(language).createTitle, message.author)
				.setDescription(format(JsonReader.commands.guildCreate.getTranslation(language).createSuccess, {guildName: askedName}))] });
		}

		// Cancel the creation
		return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildCreate.getTranslation(language).creationCancelled, true);
	};

	addBlockedPlayer(entity.discordUserId, "guildCreate");

	new DraftBotValidateReactionMessage(
		message.author,
		endCallback
	)
		.formatAuthor(JsonReader.commands.guildCreate.getTranslation(language).buyTitle, message.author)
		.setDescription(format(
			JsonReader.commands.guildCreate.getTranslation(language).buyConfirm,
			{
				guildName: askedName,
				price: JsonReader.commands.guildCreate.guildCreationPrice
			}
		))
		.setFooter(JsonReader.commands.guildCreate.getTranslation(language).buyFooter, null)
		.send(message.channel);
};

module.exports.execute = GuildCreateCommand;