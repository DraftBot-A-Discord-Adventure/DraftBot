import {Entity} from "../../core/database/game/models/Entity";
import {ICommand} from "../ICommand";
import {CommandInteraction} from "discord.js";
import {ChangeValueAdminCommands} from "../ChangeValueAdminCommands";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";

/**
 * Change the level of a player
 * @param entityToEdit
 * @param amount
 * @param interaction
 * @param language
 */
function giveLevelsTo(entityToEdit: Entity, amount: number, interaction: CommandInteraction, language: string): void {
	const ratioExpCurrentLevel: number = entityToEdit.Player.experience / entityToEdit.Player.getExperienceNeededToLevelUp();
	if (interaction.options.getString("mode") === "set") {
		entityToEdit.Player.level = amount;
	}
	else if (interaction.options.getString("mode") === "add") {
		entityToEdit.Player.level += amount;
	}
	else {
		throw new Error("wrong parameter");
	}
	entityToEdit.Player.addExperience(
		Math.floor(entityToEdit.Player.getExperienceNeededToLevelUp() * ratioExpCurrentLevel) - entityToEdit.Player.experience,
		entityToEdit,
		interaction.channel,
		language,
		NumberChangeReason.ADMIN
	).then();
}

export const commandInfo: ICommand = ChangeValueAdminCommands.getCommandInfo("level", giveLevelsTo);