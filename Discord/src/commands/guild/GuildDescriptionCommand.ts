import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandGuildDescriptionPacketReq} from "../../../../Lib/src/packets/commands/CommandGuildDescriptionPacket";

/**
 * Promote a player from a guild
 */
function getPacket(interaction: DraftbotInteraction): CommandGuildDescriptionPacketReq {
	const description = <string>interaction.options.get("description", true).value;
	return makePacket(CommandGuildDescriptionPacketReq, {description});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("guildDescription")
		.addStringOption(option =>
			SlashCommandBuilderGenerator.generateOption("guildDescription", "description", option)
				.setRequired(true)) as SlashCommandBuilder,
	getPacket,
	mainGuildCommand: false
};