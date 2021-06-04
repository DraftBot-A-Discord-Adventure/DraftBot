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
				pourcentageCommon: raritiesGenerator["0"] * 100 / maxValue,
				pourcentageUncommon: (raritiesGenerator["1"] - raritiesGenerator["0"]) * 100 / maxValue,
				pourcentageExotic: (raritiesGenerator["2"] - raritiesGenerator["1"]) * 100 / maxValue,
				pourcentageRare: (raritiesGenerator["3"] - raritiesGenerator["2"]) * 100 / maxValue,
				pourcentageSpecial: (raritiesGenerator["4"] - raritiesGenerator["3"]) * 100 / maxValue,
				pourcentageEpic: (raritiesGenerator["5"] - raritiesGenerator["4"]) * 100 / maxValue,
				pourcentageLegendary: (raritiesGenerator["6"] - raritiesGenerator["5"]) * 100 / maxValue,
				pourcentageUnique: (maxValue - raritiesGenerator["6"]) * 100 / maxValue
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

module.exports.execute = (message, language, args) => {

};

module.exports.help = {
	name : ""
};