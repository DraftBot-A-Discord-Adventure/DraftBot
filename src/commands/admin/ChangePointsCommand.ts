import {Entity} from "../../core/database/game/models/Entity";
import {ICommand} from "../ICommand";
import {CommandInteraction} from "discord.js";
import {ChangeValueAdminCommands} from "../ChangeValueAdminCommands";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";

/**
 * Change the score of a player
 * @param entityToEdit
 * @param amount
 * @param interaction
 * @param language
 */
function givePointsTo(entityToEdit: Entity, amount: number, interaction: CommandInteraction, language: string): void {
	if (interaction.options.getString("mode") === "set") {
		entityToEdit.Player.addScore(entityToEdit, amount - entityToEdit.Player.score, interaction.channel, language, NumberChangeReason.ADMIN).then();
	}
	else if (interaction.options.getString("mode") === "add") {
		entityToEdit.Player.addScore(entityToEdit, amount, interaction.channel, language, NumberChangeReason.ADMIN).then();
	}
	else {
		throw new Error("wrong parameter");
	}
}

export const commandInfo: ICommand = ChangeValueAdminCommands.getCommandInfo("points", givePointsTo);