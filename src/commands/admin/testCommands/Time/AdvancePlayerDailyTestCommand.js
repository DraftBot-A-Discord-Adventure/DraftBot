import {Entities} from "../../../../core/database/game/models/Entity";

/**
 * Quick travel your daily of a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const advancePlayerDailyTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	entity.Player.InventoryInfo.lastDailyAt -= parseInt(args[0]) * 60000;
	await entity.Player.InventoryInfo.save();
	return format(module.exports.commandInfo.messageWhenExecuted, {time: args[0]});
};

module.exports.commandInfo = {
	name: "advanceplayerdaily",
	aliases: ["adaily"],
	commandFormat: "<time>",
	typeWaited: {
		time: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez avancé votre daily de {time} minutes !",
	description: "Avance le daily de votre joueur d'une durée en minutes donnée",
	commandTestShouldReply: true,
	execute: advancePlayerDailyTestCommand
};