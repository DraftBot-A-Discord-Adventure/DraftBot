import {ICommand} from "../ICommand";
import {ChangeValueAdminCommands} from "../ChangeValueAdminCommands";
import Player from "../../core/database/game/models/Player";
import {DraftbotInteraction} from "../../core/messages/DraftbotInteraction";

/**
 * Change the weekly score of a player
 * @param playerToEdit
 * @param amount
 * @param interaction
 */
function giveWeeklyPointsTo(playerToEdit: Player, amount: number, interaction: DraftbotInteraction): void {
	if (interaction.options.get("mode").value as string === "set") {
		playerToEdit.weeklyScore = amount;
	}
	else if (interaction.options.get("mode").value as string === "add") {
		playerToEdit.weeklyScore += amount;
	}
	else {
		throw new Error("wrong parameter");
	}
}

export const commandInfo: ICommand = ChangeValueAdminCommands.getCommandInfo("pointsWeek", giveWeeklyPointsTo);