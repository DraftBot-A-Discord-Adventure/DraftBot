import {Entities} from "../../../../core/database/game/models/Entity";
import {draftBotInstance} from "../../../../core/bot";
import {format} from "../../../../core/utils/StringFormatter";

/**
 * Set the level of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerLevelTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	if (args[0] <= 0 || args[0] > 1000) {
		throw new Error("Erreur level : niveau donné doit être compris entre 1 et 1000 !");
	}
	entity.Player.level = parseInt(args[0], 10);
	draftBotInstance.logsDatabase.logLevelChange(entity.discordUserId, entity.Player.level).then();
	await entity.Player.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {level: entity.Player.level});
};

module.exports.commandInfo = {
	name: "playerlevel",
	aliases: ["level", "lvl"],
	commandFormat: "<niveau>",
	typeWaited: {
		niveau: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous êtes maintenant niveau {level} !",
	description: "Mets votre joueur au niveau donné",
	commandTestShouldReply: true,
	execute: playerLevelTestCommand
};