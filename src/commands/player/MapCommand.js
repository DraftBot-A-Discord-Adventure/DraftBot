const Maps = require("../../core/Maps");

module.exports.help = {
	name: "map",
	aliases: ["m", "world"],
	userPermissions: ROLES.USER.ALL,
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

/**
 * Show the map of DraftBot world
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const MapCommand = async (message, language) => {

	const [entity] = await Entities.getOrRegister(message.author.id);

	const mapEmbed = new discord.MessageEmbed()
		.setImage(
			JsonReader.commands.map.URL
		)

		.setColor(JsonReader.bot.embed.default)
		.setAuthor(format(JsonReader.commands.map.getTranslation(language).text, {
			pseudo: message.author.username
		}), message.author.displayAvatarURL());

	if (Maps.isTravelling(entity.Player)) {
		const destMap = await MapLocations.getById(entity.Player.mapId);
		mapEmbed.setDescription(format(
			JsonReader.commands.map.getTranslation(language).descText, {
				direction: await destMap.getDisplayName(language),
				dirDesc: await destMap.getDescription(language),
				particle: await destMap.getParticleName(language)
			}));
	}
	await message.channel.send(mapEmbed);

	log("Player " + message.author + " asked the map");
};

module.exports.execute = MapCommand;