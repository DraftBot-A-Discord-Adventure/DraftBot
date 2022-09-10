import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Entities} from "../../../../core/database/game/models/Entity";

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
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	entity.Player.PlayerMissionsInfo.dailyMissionNumberDone = 0;
	entity.Player.PlayerMissionsInfo.lastDailyMissionCompleted = new Date(0);
	await entity.Player.PlayerMissionsInfo.save();
	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = resetDailyMissionTextCommand;