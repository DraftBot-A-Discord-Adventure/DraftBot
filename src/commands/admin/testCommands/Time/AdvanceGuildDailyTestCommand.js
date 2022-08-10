import {Entities} from "../../../../core/database/game/models/Entity";
import Guild from "../../../../core/database/game/models/Guild";

module.exports.commandInfo = {
	name: "advanceguilddaily",
	aliases: ["agd"],
	commandFormat: "<time>",
	typeWaited: {
		time: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez avancé votre gd de {time} minutes !",
	description: "Avance le gd de votre joueur d'une durée en minutes donnée",
	commandTestShouldReply: true
};

/**
 * Quick travel your gd of a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const advanceGuildDailyTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const guild = await Guild.findOne({where: {id: entity.Player.guildId}});
	if (guild === null) {
		throw new Error("Erreur agd : vous n'êtes pas dans une guilde !");
	}
	guild.lastDailyAt -= parseInt(args[0]) * 60000;
	await guild.save();
	return format(module.exports.commandInfo.messageWhenExecuted, {time: args[0]});
};

module.exports.execute = advanceGuildDailyTestCommand;