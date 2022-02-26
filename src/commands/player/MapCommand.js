import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entities} from "../../core/models/Entity";

import {Maps} from "../../core/Maps";

module.exports.commandInfo = {
	name: "map",
	aliases: ["world"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

/**
 * Show the map of DraftBot world
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 */
const MapCommand = async (message, language) => {

	const [entity] = await Entities.getOrRegister(message.author.id);

	const mapEmbed = new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.map.getTranslation(language).text, message.author);

	if (Maps.isTravelling(entity.Player)) {
		const destMap = await entity.Player.getDestination();
		const strMapLink = await getStrMapWithCursor(entity.Player);
		mapEmbed.setImage(
			format(JsonReader.commands.map.URL_WITH_CURSOR,{mapLink: strMapLink})
		);
		mapEmbed.setDescription(format(
			JsonReader.commands.map.getTranslation(language).descText, {
				direction: await destMap.getDisplayName(language),
				dirDesc: await destMap.getDescription(language),
				particle: await destMap.getParticleName(language)
			}));
	}
	else {
		mapEmbed.setImage(
			format(JsonReader.commands.map.URL)
		);
		mapEmbed.setDescription(format(
			JsonReader.commands.map.getTranslation(language).descTextReached, {
				direction: await destMap.getDisplayName(language)
			}));
	}
	await message.channel.send({ embeds: [mapEmbed] });

	log("Player " + message.author + " asked the map");
};

async function getStrMapWithCursor(player){
	const destMap = await player.getDestination();
	const depMap = await player.getPreviousMap();
	let strMapLink;
	if (destMap.id < depMap.id){
		strMapLink = "" + destMap.id + "_" + depMap.id + "_" ;
	}
	else {
		strMapLink = "" + depMap.id + "_" + destMap.id + "_" ;
	}
	return strMapLink ;
}
module.exports.execute = MapCommand;