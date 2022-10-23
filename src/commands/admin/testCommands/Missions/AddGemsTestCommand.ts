import {NumberChangeReason} from "../../../../core/constants/LogsConstants";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {PlayerMissionsInfos} from "../../../../core/database/game/models/PlayerMissionsInfo";

export const commandInfo: ITestCommand = {
	name: "addgem",
	commandFormat: "<gem>",
	typeWaited: {
		gem: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {gem} :gem: !",
	description: "Ajoute la valeur donnée de gemmes à votre joueur",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Add gems to the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const addGemsTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const missionInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
	await missionInfo.addGems(parseInt(args[0], 10), player.discordUserId, NumberChangeReason.TEST);
	await missionInfo.save();

	return format(commandInfo.messageWhenExecuted, {gem: missionInfo.gems});
};

commandInfo.execute = addGemsTestCommand;