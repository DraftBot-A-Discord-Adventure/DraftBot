import {Entity} from "../../core/models/Entity";
import {ICommand} from "../ICommand";
import {CommandInteraction} from "discord.js";
import {ChangeValueAdminCommands} from "../ChangeValueAdminCommands";

/**
 * Change the weekly score of a player
 * @param entityToEdit
 * @param amount
 * @param interaction
 */
function giveWeeklyPointsTo(entityToEdit: Entity, amount: number, interaction: CommandInteraction) {
	if (interaction.options.getString("mode") === "set") {
		entityToEdit.Player.weeklyScore = amount;
	}
	else if (interaction.options.getString("mode") === "add") {
		entityToEdit.Player.weeklyScore += amount;
	}
	else {
		throw new Error("wrong parameter");
	}
}

export const commandInfo: ICommand = ChangeValueAdminCommands.getCommandInfo("pointsWeek", giveWeeklyPointsTo);