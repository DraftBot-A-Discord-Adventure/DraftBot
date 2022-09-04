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
	if (interaction.options.get("mode").value as string === "set") {
		entityToEdit.Player.level = amount;
	}
	else if (interaction.options.get("mode").value as string === "add") {
		entityToEdit.Player.level += amount;
	}
	else {
		throw new Error("wrong parameter");
	}
	entityToEdit.Player.addExperience({
		entity: entityToEdit,
		amount: Math.floor(entityToEdit.Player.getExperienceNeededToLevelUp() * ratioExpCurrentLevel) - entityToEdit.Player.experience,
		channel: interaction.channel,
		language,
		reason: NumberChangeReason.ADMIN
	}).then();
}

export const commandInfo: ICommand = ChangeValueAdminCommands.getCommandInfo("level", giveLevelsTo);