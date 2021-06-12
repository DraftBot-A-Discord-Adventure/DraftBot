/**
 * Display the shelter of guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotShelterMessageBuilder} from "../../core/messages/DraftBotShelterMessage";

const GuildShelterCommand = async(language, message) => {
	const [entity] = await Entities.getOrRegister(message.author.id);

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity) !== true) {
		return;
	}

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

module.exports = {
	commands: [
		{
			name: "shelter",
			func: GuildShelterCommand,
			aliases: [
				"guildshelter",
				"pets",
				"animals",
				"gshelter",
				"gpets",
				"ganimals",
				"guildpets",
				"guildanimals",
				"sh"
			]
		}
	]
};
