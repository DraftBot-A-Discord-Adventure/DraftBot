import {draftBotInstance} from "../../../../core/bot";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";

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
	execute: null // defined later
};

/**
 * Set the level of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerLevelTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const lvl = parseInt(args[0], 10);
	if (lvl <= 0 || lvl > 1000) {
		throw new Error("Erreur level : niveau donné doit être compris entre 1 et 1000 !");
	}
	player.level = lvl;
	draftBotInstance.logsDatabase.logLevelChange(player.discordUserId, player.level).then();
	await player.save();

	return format(commandInfo.messageWhenExecuted, {level: player.level});
};

commandInfo.execute = playerLevelTestCommand;