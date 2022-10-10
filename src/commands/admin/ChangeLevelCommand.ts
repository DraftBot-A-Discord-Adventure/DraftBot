import {ICommand} from "../ICommand";
import {CommandInteraction} from "discord.js";
import {ChangeValueAdminCommands} from "../ChangeValueAdminCommands";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import Player from "../../core/database/game/models/Player";

/**
 * Change the level of a player
 * @param playerToEdit
 * @param amount
 * @param interaction
 * @param language
 */
function giveLevelsTo(playerToEdit: Player, amount: number, interaction: CommandInteraction, language: string): void {
	const ratioExpCurrentLevel: number = playerToEdit.experience / playerToEdit.getExperienceNeededToLevelUp();
	if (interaction.options.get("mode").value as string === "set") {
		playerToEdit.level = amount;
	}
	else if (interaction.options.get("mode").value as string === "add") {
		playerToEdit.level += amount;
	}
	else {
		throw new Error("wrong parameter");
	}
	playerToEdit.addExperience({
		amount: Math.floor(playerToEdit.getExperienceNeededToLevelUp() * ratioExpCurrentLevel) - playerToEdit.experience,
		channel: interaction.channel,
		language,
		reason: NumberChangeReason.ADMIN
	}).then();
}

export const commandInfo: ICommand = ChangeValueAdminCommands.getCommandInfo("level", giveLevelsTo);