import {ICommand} from "../ICommand";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandPingPacketReq} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {SlashCommandBuilder} from "@discordjs/builders";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";

/**
 * Pings the bot, to check if it is alive and how well is it
 */
async function getPacket(interaction: DraftbotInteraction): Promise<CommandPingPacketReq> {
	const packet = makePacket(CommandPingPacketReq, {time: Date.now()});
	await interaction.reply({content: i18n.t("commands:ping.discord.create")});
	return packet;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Ping!"), // todo i18n + slash command generator
	getPacket,
	requirements: {},
	mainGuildCommand: false
};