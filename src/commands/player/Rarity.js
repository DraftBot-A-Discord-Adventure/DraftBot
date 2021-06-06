/**
 * Allows to see the probability to get an item according to its rarity.
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
function rarityCommand(language, message) {
	const maxValue = JsonReader.values.raritiesGenerator.maxValue;
	const raritiesGenerator = JsonReader.values.raritiesGenerator;
	const rarityEmbed = new discord.MessageEmbed()
		.setDescription(format(JsonReader.commands.rarity.getTranslation(language).rarities,
			{
				pourcentage_common: raritiesGenerator["0"] * 100 / maxValue,
				pourcentage_uncommon: (raritiesGenerator["1"] - raritiesGenerator["0"]) * 100 / maxValue,
				pourcentage_exotic: (raritiesGenerator["2"] - raritiesGenerator["1"]) * 100 / maxValue,
				pourcentage_rare: (raritiesGenerator["3"] - raritiesGenerator["2"]) * 100 / maxValue,
				pourcentage_special: (raritiesGenerator["4"] - raritiesGenerator["3"]) * 100 / maxValue,
				pourcentage_epic: (raritiesGenerator["5"] - raritiesGenerator["4"]) * 100 / maxValue,
				pourcentage_legendary: (raritiesGenerator["6"] - raritiesGenerator["5"]) * 100 / maxValue,
				pourcentage_unique: (maxValue - raritiesGenerator["6"]) * 100 / maxValue
			}))
		.setTitle(JsonReader.commands.rarity.getTranslation(language).title)
		.setColor(JsonReader.bot.embed.default);
	message.channel.send(rarityEmbed);
}

module.exports = {
	commands: [
		{
			name: "rarity",
			func: rarityCommand,
			aliases: ["rarities"]
		}
	]
};