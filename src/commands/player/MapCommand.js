const Maps = require('../../core/Maps');

/**
 * Show the map of DraftBot world
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function MapCommand(language, message, args) {

	let [entity] = await Entities.getOrRegister(message.author.id);

	if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
		[EFFECT.BABY, EFFECT.DEAD], entity)) !== true) {
		return;
	}

	const mapEmbed = new discord.MessageEmbed()
		.setImage(
			JsonReader.commands.map.URL
		)

		.setColor(JsonReader.bot.embed.default)
		.setAuthor(format(JsonReader.commands.map.getTranslation(language).text, {
			pseudo: message.author.username,
		}), message.author.displayAvatarURL());

	if (Maps.isTravelling(entity.Player)) {
		let destMap = await MapLocations.getById(entity.Player.map_id);
		mapEmbed.setDescription(format(
			JsonReader.commands.map.getTranslation(language).descText, {
				direction: await destMap.getDisplayName(language),
				dirDesc: await destMap.getDescription(language),
				particle: await destMap.getParticleName(language)
			}));
	}
	await message.channel.send(mapEmbed);

	log("Player " + message.author + " asked the map");
}

module.exports = {
	commands: [
		{
			name: 'map',
			func: MapCommand,
			aliases: ['m', 'world']
		}
	]
};

module.exports.execute = (message, language, args) => {

};

module.exports.help = {
	name : ""
};