import {ICommand} from "../ICommand";
import {ChangeValueAdminCommands} from "../ChangeValueAdminCommands";
import Entity from "../../core/database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";

/**
 * Change the money of a player
 * @param entityToEdit
 * @param amount
 * @param interaction
 * @param language
 */
function giveMoneyTo(entityToEdit: Entity, amount: number, interaction: CommandInteraction, language: string): void {
	if (interaction.options.getString("mode") === "set") {
		entityToEdit.Player.addMoney({
			entity: entityToEdit,
			amount: amount - entityToEdit.Player.money,
			channel: interaction.channel,
			language,
			reason: NumberChangeReason.ADMIN
		}).then();
	}
	else if (interaction.options.getString("mode") === "add") {
		entityToEdit.Player.addMoney({
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

export const commandInfo: ICommand = ChangeValueAdminCommands.getCommandInfo("money", giveMoneyTo);