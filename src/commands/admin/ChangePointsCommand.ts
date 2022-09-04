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
	if (interaction.options.get("mode").value as string === "set") {
		entityToEdit.Player.addScore({
			entity: entityToEdit,
			amount: amount - entityToEdit.Player.score,
			channel: interaction.channel,
			language,
			reason: NumberChangeReason.ADMIN
		}).then();
	}
	else if (interaction.options.get("mode").value as string === "add") {
		entityToEdit.Player.addScore({
			entity: entityToEdit,
			amount: amount,
			channel: interaction.channel,
			language,
			reason: NumberChangeReason.ADMIN
		}).then();
	}
	else {
		throw new Error("wrong parameter");
	}
}

export const commandInfo: ICommand = ChangeValueAdminCommands.getCommandInfo("points", givePointsTo);