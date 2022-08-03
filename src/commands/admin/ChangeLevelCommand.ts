import {Entity} from "../../core/models/Entity";
import {ICommand} from "../ICommand";
import {CommandInteraction} from "discord.js";
import {ChangeValueAdminCommands} from "../ChangeValueAdminCommands";

/**
 * Change the level of a player
 * @param entityToEdit
 * @param amount
 * @param interaction
 */
function giveLevelsTo(entityToEdit: Entity, amount: number, interaction: CommandInteraction): void {
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
	entityToEdit.Player.experience = Math.floor(entityToEdit.Player.getExperienceNeededToLevelUp() * ratioExpCurrentLevel);
}

export const commandInfo: ICommand = ChangeValueAdminCommands.getCommandInfo("level", giveLevelsTo);