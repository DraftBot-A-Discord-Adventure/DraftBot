import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const Maps = require("../../core/Maps");

module.exports.commandInfo = {
	name: "map",
	aliases: ["m", "world"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

/**
 * Show the map of DraftBot world
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const MapCommand = async (message, language) => {

	const [entity] = await Entities.getOrRegister(message.author.id);

	const mapEmbed = new DraftBotEmbed()
		.setImage(
			await JsonReader.commands.map.URL
		)
		.formatAuthor(JsonReader.commands.map.getTranslation(language).text, message.author);

	if (Maps.isTravelling(entity.Player)) {
		const destMap = await entity.Player.getDestination();
		mapEmbed.setDescription(format(
			JsonReader.commands.map.getTranslation(language).descText, {
				direction: await destMap.getDisplayName(language),
				dirDesc: await destMap.getDescription(language),
				particle: await destMap.getParticleName(language)
			}));
	}
	await message.channel.send({ embeds: [mapEmbed] });

	log("Player " + message.author + " asked the map");
};

module.exports.execute = MapCommand;