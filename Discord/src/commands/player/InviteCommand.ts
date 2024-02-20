import {ICommand} from "../ICommand";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Displays the bot's official server invitation link
 */
async function getPacket(interaction: DraftbotInteraction): Promise<null> {
	await interaction.reply({content: i18n.t("commands:invite.discord.main")});
	return null;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("invite"),
	getPacket,
	requirements: {},
	mainGuildCommand: false
};