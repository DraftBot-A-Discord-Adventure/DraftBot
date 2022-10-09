import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {PlayerMissionsInfos} from "../../../../core/database/game/models/PlayerMissionsInfo";

export const commandInfo: ITestCommand = {
	name: "resetDailyMission",
	commandFormat: "",
	aliases: ["rdm"],
	messageWhenExecuted: "Votre mission quotidienne a été réinitiliasée !",
	description: "Permet de réinitialiser la mission quootidienne",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set the weapon of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const resetDailyMissionTextCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const missionsInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
	missionsInfo.dailyMissionNumberDone = 0;
	missionsInfo.lastDailyMissionCompleted = new Date(0);
	await missionsInfo.save();
	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = resetDailyMissionTextCommand;