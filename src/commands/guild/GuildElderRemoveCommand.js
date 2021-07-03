import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

module.exports.help = {
	name: "guildelderremove",
	aliases: ["gelderremove", "ger"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED],
	guildRequired: true,
	guildPermissions: 3
};

/**
 * remove guild elder
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildElderRemoveCommand = async (message, language) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	const guild = await Guilds.getById(entity.Player.guildId);
	const elderRemoveEmbed = new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.guildElderRemove.getTranslation(language).elderRemoveTitle, message.author);
	elderRemoveEmbed.setDescription(
		format(
			JsonReader.commands.guildElderRemove.getTranslation(language).elderRemove,
			{
				guildName: guild.name
			}
		)
	);

	const msg = await message.channel.send(elderRemoveEmbed);

	const confirmEmbed = new DraftBotEmbed();
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