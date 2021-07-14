module.exports.help = {
	name: "shelter",
	aliases: ["guildshelter", "pets", "animals", "gshelter", "gpets", "ganimals", "guildpets", "guildanimals", "sh"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED],
	guildRequired: true
};

/**
 * Display the shelter of guild
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotShelterMessageBuilder} from "../../core/messages/DraftBotShelterMessage";

const GuildShelterCommand = async (message, language) => {
	const [entity] = await Entities.getOrRegister(message.author.id);

	// search for a user's guild
	let guild;
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}

	if (guild === null) {
		// not in a guild
		return sendErrorMessage(
			message.author, message.channel, language, JsonReader.commands.guildAdd.getTranslation(language).notInAguild);
	}

	await message.channel.send(await new DraftBotShelterMessageBuilder(guild, language).build());
};

module.exports.execute = GuildShelterCommand;