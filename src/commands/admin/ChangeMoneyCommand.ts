import {ICommand} from "../ICommand";
import {ChangeValueAdminCommands} from "../ChangeValueAdminCommands";
import Entity from "../../core/models/Entity";
import {CommandInteraction} from "discord.js";

/**
 * Change the money of a player
 * @param entityToEdit
 * @param amount
 * @param interaction
 */
function giveMoneyTo(entityToEdit: Entity, amount: number, interaction: CommandInteraction) {
	if (interaction.options.getString("mode") === "set") {
		entityToEdit.Player.money = amount;
	}
	else if (interaction.options.getString("mode") === "add") {
		entityToEdit.Player.money += amount;
	}
	else {
		throw new Error("wrong parameter");
	}
}

export const commandInfo: ICommand = ChangeValueAdminCommands.getCommandInfo("money", giveMoneyTo);