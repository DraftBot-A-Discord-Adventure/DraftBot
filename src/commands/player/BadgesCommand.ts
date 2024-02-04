import {ICommand} from "../ICommand";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandBadgesPacketReq} from "../../../../Lib/src/packets/commands/CommandBadgesPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Pings the bot, to check if it is alive and how well is it
 */
async function getPacket(interaction: DraftbotInteraction): Promise<CommandBadgesPacketReq> {
	const packet = makePacket(CommandBadgesPacketReq, {});
	await interaction.reply({content: i18n.t("commands:badges.description")});
	return packet;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("badges"),
	getPacket,
	requirements: {},
	mainGuildCommand: false
};