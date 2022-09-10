import {Entities} from "../../../../core/database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "expireMissions",
	commandFormat: "",
	messageWhenExecuted: "Toutes les missions ont expiré",
	description: "Expire toutes les missions",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Print missions info
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const expireMissionsTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	for (const mission of entity.Player.MissionSlots) {
		if (!mission.isCampaign()) {
			mission.expiresAt = new Date(1);
			await mission.save();
		}
	}
	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = expireMissionsTestCommand;