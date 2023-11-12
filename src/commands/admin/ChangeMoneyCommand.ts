import {ICommand} from "../ICommand";
import {ChangeValueAdminCommands} from "../ChangeValueAdminCommands";
import {NumberChangeReason} from "../../core/constants/LogsConstants";
import Player from "../../core/database/game/models/Player";
import {DraftbotInteraction} from "../../core/messages/DraftbotInteraction";

/**
 * Change the money of a player
 * @param playerToEdit
 * @param amount
 * @param interaction
 * @param language
 */
function giveMoneyTo(playerToEdit: Player, amount: number, interaction: DraftbotInteraction, language: string): void {
	if (interaction.options.get("mode").value as string === "set") {
		playerToEdit.addMoney({
			amount: amount - playerToEdit.money,
			channel: interaction.channel,
			language,
			reason: NumberChangeReason.ADMIN
		}).then();
	} else if (interaction.options.get("mode").value as string === "add") {
		playerToEdit.addMoney({
			amount,
			channel: interaction.channel,
			language,
			reason: NumberChangeReason.ADMIN
		}).then();
	} else {
		throw new Error("wrong parameter");
	}
}

export const commandInfo: ICommand = ChangeValueAdminCommands.getCommandInfo("money", giveMoneyTo);