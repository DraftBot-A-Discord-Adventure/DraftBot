/**
 * Show the map of DraftBot world
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function MapCommand(language, message, args) {

	const mapEmbed = new discord.MessageEmbed()
		.setImage(
			JsonReader.commands.map.URL // TODO -> remplacer l'URL dans map.json par l'URL de la map
		)
		.setColor(JsonReader.bot.embed.default)
		.setAuthor(format(JsonReader.commands.map.getTranslation(language).text, {
			pseudo: message.author.username,
		}), message.author.displayAvatarURL());
	await message.channel.send(mapEmbed);

	log("Player "+message.author+" asked the map");
}

module.exports = {
	commands: [
		{
			name: 'map',
			func: MapCommand,
			aliases: ['m', 'carte', 'monde', 'world']
		}
	]
};