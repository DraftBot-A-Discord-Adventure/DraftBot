import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Entities} from "../../../../core/database/game/models/Entity";

export const commandInfo: ITestCommand = {
	name: "clearMissions",
	commandFormat: "",
	messageWhenExecuted: "Toutes vos missions ont été supprimée !",
	description: "Permet de supprimer toutes ses missions",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set the weapon of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const clearMissionsTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);

	for (const missionSlot of entity.Player.MissionSlots) {
		if (!missionSlot.isCampaign()) {
			await missionSlot.destroy();
		}
	}

	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = clearMissionsTestCommand;