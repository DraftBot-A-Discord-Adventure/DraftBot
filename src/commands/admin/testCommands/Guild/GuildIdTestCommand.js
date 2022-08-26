import {Entities} from "../../../../core/database/game/models/Entity";
import Guild from "../../../../core/database/game/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";

/**
 * Get your guild's id
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const guildIdTestCommand = async (language, interaction) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const guild = await Guild.findOne({where: {id: entity.Player.guildId}});
	if (guild === null) {
		throw new Error("Erreur mygid : vous n'êtes pas dans une guilde !");
	}
	return format(module.exports.commandInfo.messageWhenExecuted, {gName: guild.name, idGuild: guild.id});
};

module.exports.commandInfo = {
	name: "guildid",
	aliases: ["gid", "mygid"],
	commandFormat: "",
	messageWhenExecuted: "Votre guilde ({gName}) possède l'id n°{idGuild} !",
	description: "Renvoie l'id de votre guilde",
	commandTestShouldReply: true,
	execute: guildIdTestCommand
};