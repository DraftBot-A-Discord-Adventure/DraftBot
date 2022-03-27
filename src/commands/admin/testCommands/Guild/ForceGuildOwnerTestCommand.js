import {Entities} from "../../../../core/models/Entity";
import Guild from "../../../../core/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";

module.exports.commandInfo = {
	name: "forceguildowner",
	aliases: ["fgo"],
	commandFormat: "",
	messageWhenExecuted: "Vous êtes maintenant chef de votre guilde (Guilde {gName}) !",
	description: "Vous passe chef de guilde de force"
};

/**
 * Force you to be the guild's chief
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const forceGuildOwnerTestCommand = async (language, interaction) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const guild = await Guild.findOne({where: {id: entity.Player.guildId}});
	if (guild === null) {
		throw new Error("Erreur forceguildowner : vous n'êtes pas dans une guilde !");
	}
	guild.chiefId = entity.Player.id;
	await guild.save();
	return format(module.exports.commandInfo.messageWhenExecuted, {gName: guild.name});
};

module.exports.execute = forceGuildOwnerTestCommand;