import {ICommand} from "../ICommand";
import {ChangeValueAdminCommands} from "../ChangeValueAdminCommands";
import {CommandInteraction} from "discord.js";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import Player from "../../core/database/game/models/Player";

/**
 * Change the money of a player
 * @param playerToEdit
 * @param amount
 * @param interaction
 * @param language
 */
function giveMoneyTo(playerToEdit: Player, amount: number, interaction: CommandInteraction, language: string): void {
	if (interaction.options.get("mode").value as string === "set") {
		playerToEdit.addMoney({
			entity: playerToEdit,
			amount: amount - playerToEdit.money,
			channel: interaction.channel,
			language,
			reason: NumberChangeReason.ADMIN
		}).then();
	}
	else if (interaction.options.get("mode").value as string === "add") {
		playerToEdit.addMoney({
			entity: playerToEdit,
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