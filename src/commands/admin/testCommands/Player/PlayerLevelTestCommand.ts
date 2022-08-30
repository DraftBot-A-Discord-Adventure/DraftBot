import {Entities} from "../../../../core/database/game/models/Entity";
import {draftBotInstance} from "../../../../core/bot";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

/**
 * Set the level of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerLevelTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const lvl = parseInt(args[0], 10);
	if (lvl <= 0 || lvl > 1000) {
		throw new Error("Erreur level : niveau donné doit être compris entre 1 et 1000 !");
	}
	entity.Player.level = lvl;
	draftBotInstance.logsDatabase.logLevelChange(entity.discordUserId, entity.Player.level).then();
	await entity.Player.save();

	return format(commandInfo.messageWhenExecuted, {level: entity.Player.level});
};

export const commandInfo: ITestCommand = {
	name: "playerlevel",
	aliases: ["level", "lvl"],
	commandFormat: "<niveau>",
	typeWaited: {
		niveau: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous êtes maintenant niveau {level} !",
	description: "Mets votre joueur au niveau donné",
	commandTestShouldReply: true,
	execute: playerLevelTestCommand
};